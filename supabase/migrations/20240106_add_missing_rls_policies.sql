-- Phase 2: Add Missing RLS Policies
-- This migration adds RLS policies that were missing from initial setup

-- ==========================================
-- COMMUNITY LIKES POLICIES
-- ==========================================

-- The community_likes table had RLS enabled but no policies defined
-- This was blocking all like operations

-- Allow anyone to view likes (needed for like counts)
DROP POLICY IF EXISTS "Anyone can view likes" ON community_likes;
CREATE POLICY "Anyone can view likes" ON community_likes
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own likes
DROP POLICY IF EXISTS "Users can like content" ON community_likes;
CREATE POLICY "Users can like content" ON community_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own likes (unlike)
DROP POLICY IF EXISTS "Users can unlike content" ON community_likes;
CREATE POLICY "Users can unlike content" ON community_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==========================================
-- VERIFY EXISTING POLICIES
-- ==========================================

-- Ensure posts have proper policies (should already exist)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'community_posts'
    AND policyname = 'Auth users can create posts'
  ) THEN
    CREATE POLICY "Auth users can create posts"
    ON community_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure comments have proper policies (should already exist)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'community_comments'
    AND policyname = 'Auth users can create comments'
  ) THEN
    CREATE POLICY "Auth users can create comments"
    ON community_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ==========================================
-- ADD INDEXES FOR PERFORMANCE
-- ==========================================

-- Index for faster like lookups
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON community_likes(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON community_likes(comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON community_likes(user_id);

-- Index for faster post queries
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON community_posts(is_pinned) WHERE is_pinned = true;

-- Index for faster comment queries
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON community_comments(created_at DESC);

-- ==========================================
-- FIX FOREIGN KEY CASCADE ACTIONS
-- ==========================================

-- Fix community_likes foreign keys to use CASCADE instead of SET NULL
-- This ensures likes are deleted when posts/comments are deleted
ALTER TABLE community_likes
DROP CONSTRAINT IF EXISTS community_likes_post_id_fkey;

ALTER TABLE community_likes
ADD CONSTRAINT community_likes_post_id_fkey
FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE;

ALTER TABLE community_likes
DROP CONSTRAINT IF EXISTS community_likes_comment_id_fkey;

ALTER TABLE community_likes
ADD CONSTRAINT community_likes_comment_id_fkey
FOREIGN KEY (comment_id) REFERENCES community_comments(id) ON DELETE CASCADE;

-- Ensure events created_by has CASCADE (already done in 20240105 but verify)
ALTER TABLE community_events
DROP CONSTRAINT IF EXISTS community_events_created_by_fkey;

ALTER TABLE community_events
ADD CONSTRAINT community_events_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
-- Note: SET NULL for events because we want to preserve event history even if admin is deleted
