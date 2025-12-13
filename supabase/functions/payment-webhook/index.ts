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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials')
    }

    // Parse webhook payload from Tap Payments
    const payload = await req.json()

    console.log('Received webhook from Tap Payments:', JSON.stringify(payload, null, 2))

    // Initialize Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )

    // Extract payment information from Tap webhook
    // Tap Payments webhook structure:
    // {
    //   "id": "chg_xxx",
    //   "status": "CAPTURED" | "FAILED" | "PENDING",
    //   "amount": 47,
    //   "currency": "KWD",
    //   "metadata": {
    //     "purchase_id": "123",
    //     "user_id": "user_xxx",
    //     "has_upsell": "true"
    //   },
    //   ...
    // }

    const charge = payload

    // Validate charge object
    if (!charge || !charge.id) {
      console.error('Invalid webhook payload - missing charge ID')
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Invalid webhook payload'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const chargeId = charge.id
    const chargeStatus = charge.status
    const purchaseId = charge.metadata?.purchase_id

    console.log('Charge ID:', chargeId, 'Status:', chargeStatus, 'Purchase ID:', purchaseId)

    // Determine if payment was successful
    const isSuccessful = chargeStatus === 'CAPTURED'

    // Find the purchase record by purchase_id from metadata
    if (!purchaseId) {
      console.error('Missing purchase_id in webhook metadata')
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing purchase_id in metadata'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { data: purchase, error: findError } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', purchaseId)
      .single()

    if (findError || !purchase) {
      console.error('Purchase not found:', findError)
      // Still return 200 to acknowledge webhook receipt
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Purchase not found'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update purchase status based on payment result
    const updateData: any = {
      status: isSuccessful ? 'completed' : 'failed',
      tap_charge_id: chargeId,
      updated_at: new Date().toISOString()
    }

    // Store full webhook payload for debugging
    if (payload) {
      updateData.metadata = payload
    }

    console.log('🔄 [WEBHOOK] Updating purchase status:', {
      purchase_id: purchase.id,
      user_id: purchase.user_id,
      old_status: purchase.status,
      new_status: updateData.status,
      charge_status: chargeStatus
    })

    const { error: updateError } = await supabase
      .from('purchases')
      .update(updateData)
      .eq('id', purchase.id)

    if (updateError) {
      console.error('Failed to update purchase:', updateError)
      throw new Error('Failed to update purchase status')
    }

    console.log(`✅ [WEBHOOK] Purchase ${purchase.id} updated to status: ${updateData.status}`)

    // If payment was successful, trigger additional actions
    if (isSuccessful) {
      console.log(`💰 [WEBHOOK] Payment successful for user ${purchase.user_id}, amount: ${purchase.amount_kwd} KWD`)

      // AUTOMATIC: Grant 7-day free community trial to course purchasers
      try {
        console.log('🎁 [WEBHOOK] Starting automatic 7-day community trial for course purchaser')

        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + 7) // 7 days from now

        // Create community trial subscription
        const { error: trialError } = await supabase
          .from('community_subscriptions')
          .upsert({
            user_id: purchase.user_id,
            status: 'trial',
            plan: 'trial',
            price: 0,
            trial_ends_at: trialEndsAt.toISOString(),
            current_period_start: new Date().toISOString(),
            current_period_end: trialEndsAt.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          })

        if (trialError) {
          console.error('❌ [WEBHOOK] Error creating community trial:', trialError)
        } else {
          // Update profile
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              has_community_access: true,
              community_trial_used: true
            })
            .eq('id', purchase.user_id)

          if (profileError) {
            console.error('❌ [WEBHOOK] Error updating profile for community access:', profileError)
          } else {
            console.log('✅ [WEBHOOK] 7-day community trial activated automatically')
          }
        }
      } catch (err) {
        console.error('❌ [WEBHOOK] Error in auto-trial logic:', err)
        // Don't fail the webhook if trial creation fails
      }
    }

    // Always return 200 OK to acknowledge webhook receipt
    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Webhook processed successfully',
        purchaseId: purchase.id,
        paymentStatus: updateData.status
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in payment-webhook function:', error)

    // Still return 200 to prevent webhook retries
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message || 'Internal server error'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
