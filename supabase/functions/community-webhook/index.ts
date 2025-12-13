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
    const payload = await req.json()
    console.log('🔔 [COMMUNITY-WEBHOOK] Received webhook:', JSON.stringify(payload, null, 2))

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Extract charge info
    const chargeId = payload.id
    const chargeStatus = payload.status
    const metadata = payload.metadata || {}

    console.log('📊 [COMMUNITY-WEBHOOK] Charge details:', {
      chargeId,
      status: chargeStatus,
      metadata
    })

    // Only process community subscription webhooks
    if (metadata.type !== 'community_subscription') {
      console.log('⚠️ [COMMUNITY-WEBHOOK] Not a community subscription, skipping')
      return new Response(JSON.stringify({ message: 'Not a community subscription' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = metadata.user_id

    if (!userId) {
      console.error('❌ [COMMUNITY-WEBHOOK] No user_id in metadata')
      throw new Error('user_id not found in metadata')
    }

    // Find the subscription
    const { data: subscription, error: findError } = await supabase
      .from('community_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (findError) {
      console.error('❌ [COMMUNITY-WEBHOOK] Error finding subscription:', findError)
      throw findError
    }

    if (!subscription) {
      console.error('❌ [COMMUNITY-WEBHOOK] Subscription not found for user:', userId)
      throw new Error('Subscription not found')
    }

    console.log('📦 [COMMUNITY-WEBHOOK] Found subscription:', {
      id: subscription.id,
      current_status: subscription.status
    })

    // Update subscription based on charge status
    if (chargeStatus === 'CAPTURED') {
      console.log('✅ [COMMUNITY-WEBHOOK] Payment captured, activating subscription')

      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setMonth(periodEnd.getMonth() + 1) // 1 month subscription

      const { error: updateError} = await supabase
        .from('community_subscriptions')
        .update({
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          tap_subscription_id: chargeId,
          // Save recurring payment tokens for auto-renewal
          tap_customer_id: payload.customer?.id,
          tap_card_id: payload.card?.id,
          tap_payment_agreement_id: payload.agreement?.id,
          card_last_four: payload.card?.last_four,
          card_brand: payload.card?.brand,
          tap_last_charge_id: chargeId,
          updated_at: now.toISOString()
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('❌ [COMMUNITY-WEBHOOK] Error updating subscription:', updateError)
        throw updateError
      }

      // Update profile to grant access
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          has_community_access: true
        })
        .eq('id', userId)

      if (profileError) {
        console.error('❌ [COMMUNITY-WEBHOOK] Error updating profile:', profileError)
      } else {
        console.log('✅ [COMMUNITY-WEBHOOK] Profile updated with community access')
      }

      console.log('🎉 [COMMUNITY-WEBHOOK] Subscription activated successfully')

    } else if (chargeStatus === 'DECLINED' || chargeStatus === 'FAILED') {
      console.log('❌ [COMMUNITY-WEBHOOK] Payment failed, updating status')

      const { error: updateError } = await supabase
        .from('community_subscriptions')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('❌ [COMMUNITY-WEBHOOK] Error updating subscription:', updateError)
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [COMMUNITY-WEBHOOK] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
