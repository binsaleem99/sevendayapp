import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, email, name, amount, currency, redirect_url } = await req.json()

    const TAP_SECRET_KEY = Deno.env.get('TAP_SECRET_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!TAP_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables')
    }

    console.log('🔵 [COMMUNITY-SUB] Creating subscription for user:', user_id)

    // Create Tap charge for subscription (first payment)
    // Note: For true recurring, you'd use Tap's subscription API
    // This creates a one-time charge that we'll handle renewal separately
    const tapResponse = await fetch('https://api.tap.company/v2/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAP_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        customer: {
          first_name: name,
          email: email,
        },
        source: { id: 'src_card' }, // Card payment only (VISA)
        save_card: true, // Enable card tokenization for recurring billing
        threeDSecure: true, // Enable 3D Secure for security
        redirect: {
          url: redirect_url
        },
        post: {
          url: `${SUPABASE_URL}/functions/v1/community-webhook`
        },
        metadata: {
          user_id: user_id,
          type: 'community_subscription',
          plan: 'monthly'
        },
        description: 'اشتراك مجتمع 7DayApp الشهري'
      })
    })

    const tapData = await tapResponse.json()
    console.log('💳 [COMMUNITY-SUB] Tap response:', { id: tapData.id, status: tapData.status })

    if (tapData.errors) {
      console.error('❌ [COMMUNITY-SUB] Tap API error:', tapData.errors)
      throw new Error(tapData.errors[0]?.description || 'Tap API error')
    }

    // Create pending subscription record
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )

    const { error: upsertError } = await supabaseAdmin
      .from('community_subscriptions')
      .upsert({
        user_id: user_id,
        status: 'pending',
        plan: 'monthly',
        price: amount,
        currency: currency,
        tap_subscription_id: tapData.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (upsertError) {
      console.error('❌ [COMMUNITY-SUB] Supabase error:', upsertError)
    } else {
      console.log('✅ [COMMUNITY-SUB] Subscription record created')
    }

    return new Response(
      JSON.stringify({
        paymentUrl: tapData.transaction?.url,
        chargeId: tapData.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [COMMUNITY-SUB] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
