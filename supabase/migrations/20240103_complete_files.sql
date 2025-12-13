-- Complete Files Feature - File Sharing with Download Tracking
-- Migration: 20240103_complete_files.sql

-- ==========================================
-- ENHANCE FILES TABLE
-- ==========================================

ALTER TABLE community_files
ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'document',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'resource',
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add check constraint for file_type
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_file_type'
  ) THEN
    ALTER TABLE community_files ADD CONSTRAINT valid_file_type
      CHECK (file_type IN ('document', 'image', 'video', 'code', 'template', 'other'));
  END IF;
END $$;

-- Add check constraint for category
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_file_category'
  ) THEN
    ALTER TABLE community_files ADD CONSTRAINT valid_file_category
      CHECK (category IN ('resource', 'template', 'guide', 'tool', 'other'));
  END IF;
END $$;

-- ==========================================
-- CREATE FILE DOWNLOADS TRACKING TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS community_file_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES community_files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(file_id, user_id) -- One download record per user per file
);

-- Enable RLS
ALTER TABLE community_file_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for downloads
CREATE POLICY "Anyone can view downloads" ON community_file_downloads
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can record downloads" ON community_file_downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- FUNCTION: Track File Download
-- ==========================================

CREATE OR REPLACE FUNCTION track_file_download(p_file_id UUID, p_user_id UUID)
RETURNS TABLE(success BOOLEAN, new_count INTEGER, file_url TEXT) AS $$
DECLARE
  v_file_url TEXT;
  v_new_count INTEGER;
BEGIN
  -- Get file URL
  SELECT community_files.file_url INTO v_file_url
  FROM community_files WHERE id = p_file_id;

  IF v_file_url IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, NULL::TEXT;
    RETURN;
  END IF;

  -- Insert or update download record (using ON CONFLICT to avoid duplicates)
  INSERT INTO community_file_downloads (file_id, user_id, downloaded_at)
  VALUES (p_file_id, p_user_id, NOW())
  ON CONFLICT (file_id, user_id) DO UPDATE
  SET downloaded_at = NOW();

  -- Increment download count
  UPDATE community_files
  SET download_count = download_count + 1
  WHERE id = p_file_id
  RETURNING download_count INTO v_new_count;

  RETURN QUERY SELECT TRUE, v_new_count, v_file_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- FUNCTION: Upload File (Admin Only)
-- ==========================================

CREATE OR REPLACE FUNCTION upload_community_file(
  p_title TEXT,
  p_description TEXT,
  p_file_type TEXT,
  p_category TEXT,
  p_file_size TEXT,
  p_version TEXT,
  p_storage_path TEXT,
  p_file_url TEXT,
  p_image_url TEXT,
  p_tags TEXT[],
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_file_id UUID;
BEGIN
  -- Verify admin privileges
  SELECT is_community_admin INTO v_is_admin
  FROM profiles WHERE id = p_created_by;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized to upload files';
  END IF;

  -- Insert file record
  INSERT INTO community_files (
    title,
    description,
    file_type,
    category,
    file_size,
    version,
    storage_path,
    file_url,
    image_url,
    tags,
    created_by
  ) VALUES (
    p_title,
    p_description,
    p_file_type,
    p_category,
    p_file_size,
    p_version,
    p_storage_path,
    p_file_url,
    p_image_url,
    p_tags,
    p_created_by
  ) RETURNING id INTO v_file_id;

  RETURN v_file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- FUNCTION: Delete File (Admin Only)
-- ==========================================

CREATE OR REPLACE FUNCTION delete_community_file(p_file_id UUID, p_admin_id UUID)
RETURNS TABLE(success BOOLEAN, storage_path TEXT) AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_storage_path TEXT;
BEGIN
  -- Verify admin privileges
  SELECT is_community_admin INTO v_is_admin
  FROM profiles WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized to delete files';
  END IF;

  -- Get storage path before deletion (for cleaning up storage)
  SELECT community_files.storage_path INTO v_storage_path
  FROM community_files WHERE id = p_file_id;

  -- Delete file (cascades to downloads)
  DELETE FROM community_files WHERE id = p_file_id;

  RETURN QUERY SELECT TRUE, v_storage_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- GRANT PERMISSIONS
-- ==========================================

GRANT EXECUTE ON FUNCTION track_file_download TO authenticated;
GRANT EXECUTE ON FUNCTION upload_community_file TO authenticated;
GRANT EXECUTE ON FUNCTION delete_community_file TO authenticated;

-- ==========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_files_category ON community_files(category);
CREATE INDEX IF NOT EXISTS idx_files_type ON community_files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_created_by ON community_files(created_by);
CREATE INDEX IF NOT EXISTS idx_files_featured ON community_files(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_file_downloads_file ON community_file_downloads(file_id);
CREATE INDEX IF NOT EXISTS idx_file_downloads_user ON community_file_downloads(user_id);

-- ==========================================
-- UPDATE RLS POLICIES FOR FILES
-- ==========================================

-- Allow anyone to view files
DROP POLICY IF EXISTS "Anyone can view files" ON community_files;
CREATE POLICY "Anyone can view files" ON community_files
  FOR SELECT USING (true);

-- Allow admins to insert files
DROP POLICY IF EXISTS "Admins can insert files" ON community_files;
CREATE POLICY "Admins can insert files" ON community_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_community_admin = true
    )
  );

-- Allow admins to update files
DROP POLICY IF EXISTS "Admins can update files" ON community_files;
CREATE POLICY "Admins can update files" ON community_files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_community_admin = true
    )
  );

-- Allow admins to delete files
DROP POLICY IF EXISTS "Admins can delete files" ON community_files;
CREATE POLICY "Admins can delete files" ON community_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_community_admin = true
    )
  );

-- ==========================================
-- SETUP STORAGE BUCKET (Note: Run via Supabase Dashboard)
-- ==========================================

-- Storage bucket 'community-files' should be created with:
-- - Public: true (for read access)
-- - File size limit: 50MB
-- - Allowed MIME types: application/*, image/*, text/*

-- Storage policies needed:
-- 1. Anyone can view files: SELECT on storage.objects for bucket_id = 'community-files'
-- 2. Admins can upload: INSERT on storage.objects WHERE admin check
-- 3. Admins can delete: DELETE on storage.objects WHERE admin check
