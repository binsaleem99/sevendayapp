-- Migration to update purchases table for Upayments integration
-- This migration ensures the purchases table has all required columns

-- Add columns if they don't exist
alter table purchases
  add column if not exists upayments_ref text,
  add column if not exists upayments_payment_id text,
  add column if not exists metadata jsonb;

-- Update status check constraint if it exists
alter table purchases drop constraint if exists purchases_status_check;
alter table purchases add constraint purchases_status_check
  check (status in ('pending', 'completed', 'failed'));

-- Create indexes for better performance
create index if not exists purchases_user_id_idx on purchases(user_id);
create index if not exists purchases_upayments_ref_idx on purchases(upayments_ref);
create index if not exists purchases_status_idx on purchases(status);

-- Add updated_at trigger if not exists
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_purchases_updated_at on purchases;
create trigger update_purchases_updated_at
  before update on purchases
  for each row
  execute function update_updated_at_column();

-- Add comment for documentation
comment on table purchases is 'Stores purchase records with Upayments integration';
comment on column purchases.upayments_ref is 'Order ID sent to Upayments (used for webhook matching)';
comment on column purchases.upayments_payment_id is 'Payment ID returned by Upayments webhook';
comment on column purchases.metadata is 'Full webhook payload from Upayments for debugging';
