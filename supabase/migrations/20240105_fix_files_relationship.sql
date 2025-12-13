-- Fix Bug #4: Files Foreign Key Join Error
-- This migration ensures proper foreign key relationship chain:
-- community_files.created_by → auth.users.id → profiles.id
-- This allows queries to join files → auth.users → profiles

-- Ensure profiles table has proper foreign key to auth.users
-- This is the critical link that allows the join chain to work
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify community_files has proper foreign key to auth.users
-- (This should already exist, but we verify the ON DELETE CASCADE)
ALTER TABLE community_files
DROP CONSTRAINT IF EXISTS community_files_created_by_fkey;

ALTER TABLE community_files
ADD CONSTRAINT community_files_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Now the join chain works:
-- SELECT * FROM community_files
-- JOIN auth.users ON community_files.created_by = auth.users.id
-- JOIN profiles ON auth.users.id = profiles.id
