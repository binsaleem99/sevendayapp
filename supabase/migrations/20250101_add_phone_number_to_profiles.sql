-- Add phone_number column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add index for phone number lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);

-- Add comment to document the column
COMMENT ON COLUMN profiles.phone_number IS 'User phone number in international format (e.g., +965 XXXX XXXX)';
