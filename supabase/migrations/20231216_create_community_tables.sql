-- Community posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community comments table
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community likes table
CREATE TABLE IF NOT EXISTS community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES community_comments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id)
);

-- Community subscriptions table (recurring payments)
CREATE TABLE IF NOT EXISTS community_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status TEXT DEFAULT 'inactive', -- 'active', 'inactive', 'trial', 'cancelled', 'pending'
  plan TEXT DEFAULT 'monthly', -- 'monthly', 'trial'
  price DECIMAL(10,3) DEFAULT 9.000,
  currency TEXT DEFAULT 'KWD',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  tap_subscription_id TEXT, -- For recurring billing
  tap_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add community_access to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_community_access BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS community_trial_used BOOLEAN DEFAULT false;

-- RLS Policies
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_subscriptions ENABLE ROW LEVEL SECURITY;

-- Everyone can read posts (for preview)
CREATE POLICY "Anyone can read posts" ON community_posts FOR SELECT USING (true);

-- Only authenticated users can create posts
CREATE POLICY "Auth users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own posts
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (auth.uid() = user_id);

-- Everyone can read comments
CREATE POLICY "Anyone can read comments" ON community_comments FOR SELECT USING (true);

-- Only authenticated users can create comments
CREATE POLICY "Auth users can create comments" ON community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions - users can only see their own
CREATE POLICY "Users can read own subscription" ON community_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Function to increment comments count
CREATE OR REPLACE FUNCTION increment_comments_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_posts
  SET comments_count = comments_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment likes count on posts
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample posts (only if table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM community_posts LIMIT 1) THEN
    INSERT INTO community_posts (user_id, title, content, is_pinned) VALUES
      (
        (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1),
        'مرحباً بكم في مجتمع 7DayApp! 🎉',
        'هذا المجتمع مخصص لمشاركة تجاربكم في بناء التطبيقات. شاركونا مشاريعكم وأسئلتكم ونصائحكم!',
        true
      ),
      (
        (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1),
        'نصيحة: كيف تبدأ مشروعك الأول',
        'أفضل طريقة للبدء هي اختيار فكرة بسيطة وتنفيذها خطوة بخطوة. لا تحاول بناء كل شيء مرة واحدة. ابدأ بأصغر نسخة ممكنة (MVP) ثم طور تدريجياً.',
        false
      ),
      (
        (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1),
        'سؤال: ما أفضل أداة للتصميم؟',
        'أنا مبتدئ وأبحث عن أداة سهلة لتصميم واجهات التطبيقات. ما تنصحون؟ هل Figma أفضل أم Sketch؟',
        false
      ),
      (
        (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1),
        'مشروعي الأول: تطبيق قائمة مهام',
        'بعد إكمال الدورة، قمت ببناء أول تطبيق لي! استخدمت React و Supabase. شكراً 7DayApp على المحتوى الرائع 🙏',
        false
      );
  END IF;
END $$;
