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

    if (!TAP_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables')
    }

    // Parse request body
    const { tap_id, purchase_id } = await req.json()

    if (!tap_id || !purchase_id) {
      return new Response(
        JSON.stringify({ error: 'Missing tap_id or purchase_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🔍 [VERIFY] Checking Tap payment:', { tap_id, purchase_id })

    // Call Tap API to get charge status
    const tapResponse = await fetch(`https://api.tap.company/v2/charges/${tap_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TAP_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!tapResponse.ok) {
      console.error('❌ [VERIFY] Tap API error:', tapResponse.status)
      throw new Error('Failed to verify payment with Tap')
    }

    const tapData = await tapResponse.json()
    console.log('📊 [VERIFY] Tap charge data:', JSON.stringify(tapData, null, 2))

    const chargeStatus = tapData.status
    const isSuccessful = chargeStatus === 'CAPTURED'

    console.log('💳 [VERIFY] Payment status:', {
      tap_id,
      status: chargeStatus,
      isSuccessful
    })

    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )

    // Get current purchase status
    const { data: purchase, error: fetchError } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', purchase_id)
      .single()

    if (fetchError || !purchase) {
      console.error('❌ [VERIFY] Purchase not found:', fetchError)
      throw new Error('Purchase not found')
    }

    console.log('📦 [VERIFY] Current purchase status:', purchase.status)

    // If already completed, no need to update
    if (purchase.status === 'completed') {
      console.log('✅ [VERIFY] Purchase already completed')
      return new Response(
        JSON.stringify({
          success: true,
          status: 'completed',
          message: 'Purchase already completed'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update purchase status if payment is successful
    if (isSuccessful && purchase.status !== 'completed') {
      console.log('🔄 [VERIFY] Updating purchase to completed')

      const { error: updateError } = await supabase
        .from('purchases')
        .update({
          status: 'completed',
          tap_charge_id: tap_id,
          updated_at: new Date().toISOString(),
          metadata: tapData
        })
        .eq('id', purchase_id)

      if (updateError) {
        console.error('❌ [VERIFY] Failed to update purchase:', updateError)
        throw new Error('Failed to update purchase status')
      }

      console.log('✅ [VERIFY] Purchase updated to completed')

      return new Response(
        JSON.stringify({
          success: true,
          status: 'completed',
          message: 'Payment verified and purchase completed'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Payment is not successful yet
    return new Response(
      JSON.stringify({
        success: false,
        status: chargeStatus.toLowerCase(),
        message: `Payment status: ${chargeStatus}`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ [VERIFY] Error:', error)
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
