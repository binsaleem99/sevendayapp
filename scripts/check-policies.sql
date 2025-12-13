-- Check all RLS policies on community_posts
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'community_posts'
ORDER BY policyname;

-- Check if the policy actually exists
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'community_posts'
AND cmd = 'INSERT';

-- Try to see what the actual WITH CHECK clause is
SELECT policyname, with_check
FROM pg_policies
WHERE tablename = 'community_posts'
AND cmd = 'INSERT';
