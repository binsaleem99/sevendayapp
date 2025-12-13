import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cdfzrgceveqarepymywq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZnpyZ2NldmVxYXJlcHlteXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NzgzMjIsImV4cCI6MjA4MTE1NDMyMn0.VFEVhb4KlUzWdcnOA2uK9lHIWo8zsic2RLGMgSTGyQI'
);

async function debugRLS() {
  console.log('🔍 Debugging RLS Policies...\n');

  // 2. Try to get current user
  console.log('📋 1. Checking current auth state...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('   ❌ No authenticated user. Need to login first.\n');

    // Try to login with test user
    console.log('   Attempting login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'testuser_7dayapp@test.com',
      password: 'TestUser123!@#'
    });

    if (loginError) {
      console.log('   ❌ Login failed:', loginError.message);
      return;
    }
    console.log('   ✅ Logged in as:', loginData.user?.email);
    console.log('   User ID:', loginData.user?.id);
  } else {
    console.log('   ✅ Authenticated as:', user.email);
    console.log('   User ID:', user.id);
  }

  // 3. Check if user has a profile
  console.log('\n📋 2. Checking user profile...');
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (currentUser) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (profileError) {
      console.log('   ❌ Profile error:', profileError.message);
      console.log('   Code:', profileError.code);
      console.log('   This might be the issue - user has no profile or cannot access it!');
    } else {
      console.log('   ✅ Profile found:');
      console.log('      ID:', profile.id);
      console.log('      Name:', profile.full_name);
      console.log('      Email:', profile.email);
      console.log('      Is Admin:', profile.is_community_admin);
    }
  }

  // 4. Try to create a post and capture the exact error
  console.log('\n📋 3. Attempting to create a test post...');
  const { data: { user: postUser } } = await supabase.auth.getUser();

  if (postUser) {
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .insert({
        user_id: postUser.id,
        title: 'Debug Test Post',
        content: 'This is a debug test post',
        category: 'general'
      })
      .select()
      .single();

    if (postError) {
      console.log('   ❌ Post creation failed!');
      console.log('   Error code:', postError.code);
      console.log('   Error message:', postError.message);
      console.log('   Error details:', postError.details);
      console.log('   Error hint:', postError.hint);
    } else {
      console.log('   ✅ Post created successfully!');
      console.log('   Post ID:', post.id);

      // Clean up - delete the test post
      await supabase.from('community_posts').delete().eq('id', post.id);
      console.log('   🧹 Test post cleaned up');
    }
  }

  // 5. Try a raw query to check RLS policies
  console.log('\n📋 4. Checking existing posts...');
  const { data: posts, error: postsError } = await supabase
    .from('community_posts')
    .select('id, title, user_id')
    .limit(5);

  if (postsError) {
    console.log('   ❌ Cannot read posts:', postsError.message);
  } else {
    console.log('   ✅ Can read posts. Found:', posts?.length || 0, 'posts');
    if (posts && posts.length > 0) {
      console.log('   First post:', posts[0]);
    }
  }

  console.log('\n🏁 Debug complete!');
}

debugRLS().catch(console.error);
