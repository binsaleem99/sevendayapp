-- Migration to update purchases table for Tap Payments integration
-- This migration renames Upayments columns to Tap Payments equivalents

-- Rename upayments_ref to tap_charge_id (or drop it since we don't need it)
-- We'll keep the column but repurpose it
alter table purchases rename column upayments_ref to tap_charge_id;

-- Drop the old upayments_payment_id column as we don't need it anymore
alter table purchases drop column if exists upayments_payment_id;

-- Update index name
drop index if exists purchases_upayments_ref_idx;
create index if not exists purchases_tap_charge_id_idx on purchases(tap_charge_id);

-- Update comments for documentation
comment on table purchases is 'Stores purchase records with Tap Payments integration';
comment on column purchases.tap_charge_id is 'Charge ID from Tap Payments webhook';
comment on column purchases.metadata is 'Full webhook payload from Tap Payments for debugging';
