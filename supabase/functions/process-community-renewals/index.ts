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
    console.log('🔄 [RENEWALS] Starting community subscription renewal process')

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const TAP_SECRET_KEY = Deno.env.get('TAP_SECRET_KEY')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TAP_SECRET_KEY) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Find subscriptions expiring in the next 24 hours
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: expiringSubscriptions, error: fetchError } = await supabase
      .from('community_subscriptions')
      .select('*')
      .eq('status', 'active')
      .not('tap_payment_agreement_id', 'is', null)
      .lt('current_period_end', tomorrow.toISOString())

    if (fetchError) {
      console.error('❌ [RENEWALS] Error fetching subscriptions:', fetchError)
      throw fetchError
    }

    console.log(`📊 [RENEWALS] Found ${expiringSubscriptions?.length || 0} expiring subscriptions`)

    const results = []

    for (const subscription of expiringSubscriptions || []) {
      console.log(`💳 [RENEWALS] Processing renewal for user ${subscription.user_id}`)

      try {
        // Create renewal charge using saved card token
        const chargeResponse = await fetch('https://api.tap.company/v2/charges', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${TAP_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: 9,
            currency: 'KWD',
            source: {
              type: 'token',
              id: subscription.tap_payment_agreement_id
            },
            customer_initiated: false, // Merchant-initiated transaction
            metadata: {
              user_id: subscription.user_id,
              type: 'community_renewal',
              subscription_id: subscription.id
            },
            description: 'تجديد اشتراك مجتمع 7DayApp'
          })
        })

        const chargeData = await chargeResponse.json()
        console.log(`📨 [RENEWALS] Tap response for user ${subscription.user_id}:`, {
          id: chargeData.id,
          status: chargeData.status
        })

        if (chargeData.status === 'CAPTURED') {
          // Payment successful - extend subscription by 1 month
          const newPeriodEnd = new Date(subscription.current_period_end)
          newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1)

          const { error: updateError } = await supabase
            .from('community_subscriptions')
            .update({
              current_period_start: subscription.current_period_end,
              current_period_end: newPeriodEnd.toISOString(),
              tap_last_charge_id: chargeData.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id)

          if (updateError) {
            console.error(`❌ [RENEWALS] Error updating subscription for user ${subscription.user_id}:`, updateError)
            results.push({
              user_id: subscription.user_id,
              status: 'error',
              error: updateError.message
            })
          } else {
            console.log(`✅ [RENEWALS] Successfully renewed subscription for user ${subscription.user_id}`)
            results.push({
              user_id: subscription.user_id,
              status: 'renewed',
              new_period_end: newPeriodEnd.toISOString()
            })
          }
        } else if (chargeData.status === 'DECLINED' || chargeData.status === 'FAILED') {
          // Payment failed - mark subscription inactive
          console.log(`❌ [RENEWALS] Payment failed for user ${subscription.user_id}`)

          const { error: deactivateError } = await supabase
            .from('community_subscriptions')
            .update({
              status: 'inactive',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id)

          if (deactivateError) {
            console.error(`❌ [RENEWALS] Error deactivating subscription:`, deactivateError)
          }

          // Revoke community access
          await supabase
            .from('profiles')
            .update({ has_community_access: false })
            .eq('id', subscription.user_id)

          results.push({
            user_id: subscription.user_id,
            status: 'failed',
            reason: chargeData.response?.message || 'Payment declined'
          })
        } else {
          // Pending or other status
          console.log(`⏳ [RENEWALS] Charge pending for user ${subscription.user_id}`)
          results.push({
            user_id: subscription.user_id,
            status: 'pending',
            charge_status: chargeData.status
          })
        }
      } catch (err) {
        console.error(`❌ [RENEWALS] Error processing user ${subscription.user_id}:`, err)
        results.push({
          user_id: subscription.user_id,
          status: 'error',
          error: err.message
        })
      }
    }

    const summary = {
      total_processed: results.length,
      successful: results.filter(r => r.status === 'renewed').length,
      failed: results.filter(r => r.status === 'failed').length,
      errors: results.filter(r => r.status === 'error').length,
      pending: results.filter(r => r.status === 'pending').length
    }

    console.log('📊 [RENEWALS] Process complete:', summary)

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('❌ [RENEWALS] Fatal error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
