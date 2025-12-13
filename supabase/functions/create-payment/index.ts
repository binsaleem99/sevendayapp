import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const TAP_SECRET_KEY = Deno.env.get('TAP_SECRET_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!TAP_SECRET_KEY) {
      throw new Error('Missing Tap Payments credentials')
    }

    // Parse request body
    const { userId, email, name, amount, hasUpsell } = await req.json()

    // Validate input
    if (!userId || !email || !name || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get app URL from headers or use default
    // Note: Using HashRouter, so URLs need /# prefix
    const origin = req.headers.get('origin') || 'http://localhost:3000'

    // Create pending purchase record in database
    const { data: purchase, error: dbError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        amount_kwd: amount,
        status: 'pending',
        has_upsell: hasUpsell || false
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to create purchase record')
    }

    // Prepare Tap Payments API request
    const tapPayload = {
      amount: amount,
      currency: "KWD",
      threeDSecure: true,
      save_card: false,
      description: "دورة تطبيق الـ 7 أيام",
      receipt: {
        email: true,
        sms: false
      },
      customer: {
        first_name: name,
        email: email
      },
      source: {
        id: "src_all"
      },
      redirect: {
        // Tap will append ?tap_id=xxx to this URL
        // Using HashRouter format: origin/#/success
        url: `${origin}/#/success?ref=${purchase.id}`
      },
      post: {
        url: `${SUPABASE_URL}/functions/v1/payment-webhook`
      },
      metadata: {
        purchase_id: purchase.id.toString(),
        user_id: userId,
        has_upsell: hasUpsell ? "true" : "false"
      }
    }

    console.log('Calling Tap Payments API with payload:', JSON.stringify(tapPayload, null, 2))

    // Call Tap Payments API
    const tapResponse = await fetch('https://api.tap.company/v2/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAP_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tapPayload)
    })

    const tapData = await tapResponse.json()

    console.log('Tap Payments API response status:', tapResponse.status)
    console.log('Tap Payments API response:', JSON.stringify(tapData, null, 2))

    if (!tapResponse.ok || !tapData.transaction?.url) {
      console.error('Tap Payments API error - Status:', tapResponse.status)
      console.error('Tap Payments API error - Response:', JSON.stringify(tapData, null, 2))

      // Update purchase status to failed
      await supabase
        .from('purchases')
        .update({ status: 'failed' })
        .eq('id', purchase.id)

      throw new Error(tapData.message || 'Failed to create payment session')
    }

    // Return payment URL to client
    return new Response(
      JSON.stringify({
        paymentUrl: tapData.transaction.url,
        chargeId: tapData.id,
        purchaseId: purchase.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in create-payment function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
