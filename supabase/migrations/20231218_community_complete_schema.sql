-- Migration: 20231218_community_complete_schema.sql

-- 1. Update profiles table for community features
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS community_level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS community_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_community_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Ensure community_posts has all required fields
ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general'
    CHECK (category IN ('general', 'announcements', 'success', 'help'));

-- 3. Ensure community_comments has required fields
ALTER TABLE community_comments
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 4. Create community_likes table if not exists
CREATE TABLE IF NOT EXISTS community_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 5. Create comment_likes table
CREATE TABLE IF NOT EXISTS community_comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 6. Create calendar_events table
CREATE TABLE IF NOT EXISTS community_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TEXT,
  attendees_count INTEGER DEFAULT 0,
  image_url TEXT,
  is_online BOOLEAN DEFAULT true,
  zoom_link TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create event_registrations table
CREATE TABLE IF NOT EXISTS community_event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES community_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 8. Create community_files table
CREATE TABLE IF NOT EXISTS community_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT 'v1.0.0',
  file_url TEXT NOT NULL,
  file_size TEXT,
  download_count INTEGER DEFAULT 0,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create file_comments table
CREATE TABLE IF NOT EXISTS community_file_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES community_files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. RLS Policies
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_file_comments ENABLE ROW LEVEL SECURITY;

-- Allow read for community members
CREATE POLICY "Community members can read" ON community_events
  FOR SELECT USING (true);

CREATE POLICY "Community members can read files" ON community_files
  FOR SELECT USING (true);

-- Allow authenticated users to like
CREATE POLICY "Users can like posts" ON community_likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can like comments" ON community_comment_likes
  FOR ALL USING (auth.uid() = user_id);

-- Allow event registration
CREATE POLICY "Users can register for events" ON community_event_registrations
  FOR ALL USING (auth.uid() = user_id);

-- 11. Create indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_pinned ON community_posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_community_events_date ON community_events(event_date);
CREATE INDEX IF NOT EXISTS idx_community_likes_post ON community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON profiles(community_level);

-- 12. Insert sample pinned post
INSERT INTO community_posts (user_id, title, content, category, is_pinned, likes_count)
SELECT
  id,
  'أهلاً بكم في مجتمع داي آب! 🚀',
  'نحن سعداء جداً بانضمامكم إلينا. هذا المجتمع مخصص لمساعدتكم في رحلتكم التعليمية. لا تترددوا في طرح الأسئلة ومشاركة تجاربكم.',
  'general',
  true,
  0
FROM profiles
WHERE is_community_admin = true
LIMIT 1
ON CONFLICT DO NOTHING;
