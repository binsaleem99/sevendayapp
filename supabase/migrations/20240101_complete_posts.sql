-- Complete Posts Feature - Atomic Like/Unlike Operations and Admin Controls
-- Migration: 20240101_complete_posts.sql

-- ==========================================
-- FUNCTION: Toggle Post Like (Atomic Operation)
-- ==========================================
-- Prevents race conditions by handling check-delete-update or check-insert-update atomically
-- Returns whether the post is now liked and the new like count

CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID, p_user_id UUID)
RETURNS TABLE(liked BOOLEAN, new_count INTEGER) AS $$
DECLARE
  v_existing_id UUID;
  v_new_count INTEGER;
  v_liked BOOLEAN;
BEGIN
  -- Check if like already exists
  SELECT id INTO v_existing_id FROM community_likes
  WHERE post_id = p_post_id AND user_id = p_user_id;

  IF v_existing_id IS NOT NULL THEN
    -- Unlike: Delete the like and decrement count
    DELETE FROM community_likes WHERE id = v_existing_id;
    UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = p_post_id RETURNING likes_count INTO v_new_count;
    v_liked := FALSE;
  ELSE
    -- Like: Insert like and increment count
    INSERT INTO community_likes (post_id, user_id) VALUES (p_post_id, p_user_id);
    UPDATE community_posts SET likes_count = likes_count + 1
    WHERE id = p_post_id RETURNING likes_count INTO v_new_count;
    v_liked := TRUE;
  END IF;

  RETURN QUERY SELECT v_liked, v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- FUNCTION: Toggle Comment Like (Atomic Operation)
-- ==========================================

CREATE OR REPLACE FUNCTION toggle_comment_like(p_comment_id UUID, p_user_id UUID)
RETURNS TABLE(liked BOOLEAN, new_count INTEGER) AS $$
DECLARE
  v_existing_id UUID;
  v_new_count INTEGER;
  v_liked BOOLEAN;
BEGIN
  -- Check if like already exists
  SELECT id INTO v_existing_id FROM community_comment_likes
  WHERE comment_id = p_comment_id AND user_id = p_user_id;

  IF v_existing_id IS NOT NULL THEN
    -- Unlike
    DELETE FROM community_comment_likes WHERE id = v_existing_id;
    UPDATE community_comments SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = p_comment_id RETURNING likes_count INTO v_new_count;
    v_liked := FALSE;
  ELSE
    -- Like
    INSERT INTO community_comment_likes (comment_id, user_id) VALUES (p_comment_id, p_user_id);
    UPDATE community_comments SET likes_count = likes_count + 1
    WHERE id = p_comment_id RETURNING likes_count INTO v_new_count;
    v_liked := TRUE;
  END IF;

  RETURN QUERY SELECT v_liked, v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- FUNCTION: Toggle Post Pin (Admin Only)
-- ==========================================

CREATE OR REPLACE FUNCTION toggle_post_pin(p_post_id UUID, p_admin_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_current_pin_status BOOLEAN;
BEGIN
  -- Verify admin privileges
  SELECT is_community_admin INTO v_is_admin
  FROM profiles WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized to pin/unpin posts';
  END IF;

  -- Toggle the pin status
  UPDATE community_posts
  SET is_pinned = NOT is_pinned
  WHERE id = p_post_id
  RETURNING is_pinned INTO v_current_pin_status;

  RETURN v_current_pin_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- FUNCTION: Delete Post (Author or Admin Only)
-- ==========================================

CREATE OR REPLACE FUNCTION delete_post(p_post_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_author BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is the author
  SELECT EXISTS(SELECT 1 FROM community_posts WHERE id = p_post_id AND user_id = p_user_id) INTO v_is_author;

  -- Check if user is admin
  SELECT is_community_admin INTO v_is_admin
  FROM profiles WHERE id = p_user_id;

  IF NOT v_is_author AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized to delete this post';
  END IF;

  -- Delete the post (cascading will handle comments, likes)
  DELETE FROM community_posts WHERE id = p_post_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- GRANT PERMISSIONS
-- ==========================================

GRANT EXECUTE ON FUNCTION toggle_post_like TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_comment_like TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_post_pin TO authenticated;
GRANT EXECUTE ON FUNCTION delete_post TO authenticated;

-- ==========================================
-- ENSURE TABLES HAVE CORRECT COLUMNS
-- ==========================================

-- Add likes_count to community_comments if not exists
ALTER TABLE community_comments
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create comment likes table if not exists
CREATE TABLE IF NOT EXISTS community_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Add RLS policies for comment likes
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment likes" ON community_comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like comments" ON community_comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" ON community_comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON community_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON community_comment_likes(user_id);
