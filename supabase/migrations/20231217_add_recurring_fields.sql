-- Add fields needed for Tap recurring payments
ALTER TABLE community_subscriptions
  ADD COLUMN IF NOT EXISTS tap_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS tap_card_id TEXT,
  ADD COLUMN IF NOT EXISTS tap_payment_agreement_id TEXT,
  ADD COLUMN IF NOT EXISTS tap_last_charge_id TEXT,
  ADD COLUMN IF NOT EXISTS card_last_four TEXT,
  ADD COLUMN IF NOT EXISTS card_brand TEXT;

-- Add index on payment_agreement_id for faster renewal lookups
CREATE INDEX IF NOT EXISTS community_subscriptions_agreement_idx
  ON community_subscriptions(tap_payment_agreement_id)
  WHERE tap_payment_agreement_id IS NOT NULL;

-- Add index on current_period_end for renewal cron job
CREATE INDEX IF NOT EXISTS community_subscriptions_period_end_idx
  ON community_subscriptions(current_period_end)
  WHERE status = 'active';

COMMENT ON COLUMN community_subscriptions.tap_customer_id IS 'Tap customer ID for recurring billing';
COMMENT ON COLUMN community_subscriptions.tap_card_id IS 'Tap card ID for saved card';
COMMENT ON COLUMN community_subscriptions.tap_payment_agreement_id IS 'Tap payment agreement ID for auto-renewal';
COMMENT ON COLUMN community_subscriptions.tap_last_charge_id IS 'Last successful charge ID';
COMMENT ON COLUMN community_subscriptions.card_last_four IS 'Last 4 digits of card for display';
COMMENT ON COLUMN community_subscriptions.card_brand IS 'Card brand (VISA, Mastercard, etc)';
