-- Fix Bug #3: Profile RLS Policies Missing
-- This migration adds comprehensive RLS policies to the profiles table
-- Without these policies, user registration, profile updates, and admin checks fail

-- Enable RLS on profiles table (may already be enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent migration)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Policy 1: Allow anyone (authenticated or not) to view profiles
-- This is needed for:
-- - Displaying post/comment authors
-- - Showing event creators
-- - Displaying file uploaders
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Policy 2: Allow users to insert their own profile during signup
-- This is critical for user registration flow
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to update their own profile
-- This enables profile editing functionality
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Note: We intentionally do NOT allow DELETE on profiles
-- User deletion should be handled through auth.users cascade
