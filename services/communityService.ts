import { supabase } from '../lib/supabase';

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: { full_name: string; email: string };
  comments?: CommunityComment[];
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  author?: { full_name: string; email: string };
}

export interface CommunitySubscription {
  id: string;
  user_id: string;
  status: 'active' | 'inactive' | 'trial' | 'cancelled' | 'pending';
  plan: string;
  price: number;
  trial_ends_at?: string;
  current_period_start?: string;
  current_period_end?: string;
  tap_subscription_id?: string;
  created_at: string;
}

/**
 * Get all posts with author info
 */
export async function getPosts(): Promise<CommunityPost[]> {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles!user_id(full_name, email)
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * Get single post with comments
 */
export async function getPostWithComments(postId: string): Promise<CommunityPost | null> {
  try {
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles!user_id(full_name, email)
      `)
      .eq('id', postId)
      .single();

    if (postError) throw postError;

    const { data: comments, error: commentsError } = await supabase
      .from('community_comments')
      .select(`
        *,
        author:profiles!user_id(full_name, email)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true});

    if (commentsError) throw commentsError;

    return { ...post, comments: comments || [] };
  } catch (error) {
    console.error('Error fetching post with comments:', error);
    return null;
  }
}

/**
 * Create a new post
 */
export async function createPost(userId: string, title: string, content: string): Promise<CommunityPost | null> {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        user_id: userId,
        title,
        content
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
}

/**
 * Create a comment on a post
 */
export async function createComment(postId: string, userId: string, content: string): Promise<CommunityComment | null> {
  try {
    const { data, error} = await supabase
      .from('community_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content
      })
      .select()
      .single();

    if (error) throw error;

    // Increment comments count
    await supabase.rpc('increment_comments_count', { post_id: postId });

    return data;
  } catch (error) {
    console.error('Error creating comment:', error);
    return null;
  }
}

/**
 * Check if user has community access
 */
export async function checkCommunityAccess(userId: string): Promise<{
  hasAccess: boolean;
  subscription?: CommunitySubscription;
  reason?: string;
}> {
  try {
    // Check subscription
    const { data: subscription, error } = await supabase
      .from('community_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking subscription:', error);
    }

    if (subscription) {
      // Check if active
      if (subscription.status === 'active' && subscription.current_period_end) {
        const periodEnd = new Date(subscription.current_period_end);
        if (periodEnd > new Date()) {
          return { hasAccess: true, subscription, reason: 'active_subscription' };
        }
      }

      // Check if valid trial
      if (subscription.status === 'trial' && subscription.trial_ends_at) {
        const trialEnd = new Date(subscription.trial_ends_at);
        if (trialEnd > new Date()) {
          return { hasAccess: true, subscription, reason: 'trial' };
        }
      }
    }

    return { hasAccess: false, subscription: subscription || undefined };
  } catch (error) {
    console.error('Error in checkCommunityAccess:', error);
    return { hasAccess: false };
  }
}

/**
 * Start free trial (for course purchasers) - Called automatically after course purchase
 */
export async function startFreeTrial(userId: string): Promise<CommunitySubscription | null> {
  try {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7 days trial

    const { data, error } = await supabase
      .from('community_subscriptions')
      .upsert({
        user_id: userId,
        status: 'trial',
        plan: 'trial',
        price: 0,
        trial_ends_at: trialEndsAt.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEndsAt.toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    // Update profile
    await supabase
      .from('profiles')
      .update({
        has_community_access: true,
        community_trial_used: true
      })
      .eq('id', userId);

    return data;
  } catch (error) {
    console.error('Error starting free trial:', error);
    return null;
  }
}

/**
 * Get community stats for admin dashboard
 */
export async function getCommunityStats(): Promise<{
  totalMembers: number;
  activeSubscriptions: number;
  totalPosts: number;
  monthlyRevenue: number;
}> {
  try {
    // Get total members with community access
    const { count: totalMembers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('has_community_access', true);

    // Get active subscriptions
    const { data: activeSubs } = await supabase
      .from('community_subscriptions')
      .select('*')
      .in('status', ['active', 'trial']);

    // Get total posts
    const { count: totalPosts } = await supabase
      .from('community_posts')
      .select('*', { count: 'exact', head: true });

    // Calculate monthly revenue (9 KWD per active subscription)
    const activeCount = activeSubs?.filter(sub => sub.status === 'active').length || 0;
    const monthlyRevenue = activeCount * 9;

    return {
      totalMembers: totalMembers || 0,
      activeSubscriptions: activeSubs?.length || 0,
      totalPosts: totalPosts || 0,
      monthlyRevenue
    };
  } catch (error) {
    console.error('Error getting community stats:', error);
    return {
      totalMembers: 0,
      activeSubscriptions: 0,
      totalPosts: 0,
      monthlyRevenue: 0
    };
  }
}

/**
 * Get comments for a post with user like status
 */
export async function getCommentsForPost(postId: string, userId: string | null): Promise<any[]> {
  try {
    const { data: comments, error } = await supabase
      .from('community_comments')
      .select(`
        *,
        author:profiles!user_id(full_name, avatar_url, community_level, is_community_admin)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // If user is logged in, check which comments they've liked
    if (userId && comments) {
      const { data: userLikes } = await supabase
        .from('community_comment_likes')
        .select('comment_id')
        .eq('user_id', userId)
        .in('comment_id', comments.map(c => c.id));

      const likedCommentIds = new Set(userLikes?.map(l => l.comment_id) || []);

      return comments.map(comment => ({
        ...comment,
        user_liked: likedCommentIds.has(comment.id)
      }));
    }

    return comments || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

/**
 * Toggle like on a comment (atomic operation via RPC)
 */
export async function toggleCommentLike(commentId: string, userId: string): Promise<{
  liked: boolean;
  newCount: number;
} | null> {
  try {
    const { data, error } = await supabase
      .rpc('toggle_comment_like', {
        p_comment_id: commentId,
        p_user_id: userId
      });

    if (error) throw error;

    // RPC returns array with single row
    return data?.[0] || null;
  } catch (error) {
    console.error('Error toggling comment like:', error);
    return null;
  }
}

/**
 * Toggle like on a post (atomic operation via RPC)
 */
export async function togglePostLike(postId: string, userId: string): Promise<{
  liked: boolean;
  newCount: number;
} | null> {
  try {
    const { data, error } = await supabase
      .rpc('toggle_post_like', {
        p_post_id: postId,
        p_user_id: userId
      });

    if (error) throw error;

    // RPC returns array with single row
    return data?.[0] || null;
  } catch (error) {
    console.error('Error toggling post like:', error);
    return null;
  }
}

/**
 * Toggle pin status on a post (admin only)
 */
export async function togglePostPin(postId: string, adminId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('toggle_post_pin', {
        p_post_id: postId,
        p_admin_id: adminId
      });

    if (error) throw error;
    return data === true;
  } catch (error) {
    console.error('Error toggling post pin:', error);
    return false;
  }
}

/**
 * Delete a post (author or admin only)
 */
export async function deletePost(postId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('delete_post', {
        p_post_id: postId,
        p_user_id: userId
      });

    if (error) throw error;
    return data === true;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
}

// ==========================================
// EVENTS FUNCTIONALITY
// ==========================================

/**
 * Get all events with registration status for a user
 */
export async function getEvents(userId: string | null = null) {
  try {
    const { data: events, error } = await supabase
      .from('community_events')
      .select('*')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true });

    if (error) throw error;

    // If user is logged in, check which events they're registered for
    if (userId && events) {
      const { data: registrations } = await supabase
        .from('community_event_registrations')
        .select('event_id')
        .eq('user_id', userId);

      const registeredEventIds = new Set(registrations?.map(r => r.event_id) || []);

      return events.map(event => ({
        ...event,
        is_registered: registeredEventIds.has(event.id),
        is_full: event.max_attendees ? event.attendees_count >= event.max_attendees : false
      }));
    }

    return events?.map(event => ({
      ...event,
      is_registered: false,
      is_full: event.max_attendees ? event.attendees_count >= event.max_attendees : false
    })) || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

/**
 * Create a new event (admin only)
 */
export async function createEvent(eventData: {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  event_type: string;
  max_attendees?: number;
  is_online: boolean;
  location?: string;
  meeting_link?: string;
  image_url?: string;
}, adminId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .rpc('create_community_event', {
        p_title: eventData.title,
        p_description: eventData.description,
        p_event_date: eventData.event_date,
        p_event_time: eventData.event_time,
        p_event_type: eventData.event_type,
        p_max_attendees: eventData.max_attendees || null,
        p_is_online: eventData.is_online,
        p_location: eventData.location || null,
        p_meeting_link: eventData.meeting_link || null,
        p_image_url: eventData.image_url || null,
        p_created_by: adminId
      });

    if (error) throw error;
    return data; // Returns event ID
  } catch (error) {
    console.error('Error creating event:', error);
    return null;
  }
}

/**
 * Register for an event
 */
export async function registerForEvent(eventId: string, userId: string): Promise<{
  success: boolean;
  message: string;
  attendees_count: number;
} | null> {
  try {
    const { data, error } = await supabase
      .rpc('register_for_event', {
        p_event_id: eventId,
        p_user_id: userId
      });

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error registering for event:', error);
    return null;
  }
}

/**
 * Unregister from an event
 */
export async function unregisterFromEvent(eventId: string, userId: string): Promise<{
  success: boolean;
  message: string;
  attendees_count: number;
} | null> {
  try {
    const { data, error } = await supabase
      .rpc('unregister_from_event', {
        p_event_id: eventId,
        p_user_id: userId
      });

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error unregistering from event:', error);
    return null;
  }
}

/**
 * Delete an event (admin only)
 */
export async function deleteEvent(eventId: string, adminId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('delete_community_event', {
        p_event_id: eventId,
        p_admin_id: adminId
      });

    if (error) throw error;
    return data === true;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
}

// ==========================================
// FILES FUNCTIONALITY
// ==========================================

/**
 * Get all files with download status for a user
 */
export async function getFiles(userId: string | null = null) {
  try {
    // Fetch files without author info initially (workaround for FK issue)
    const { data: rawFiles, error } = await supabase
      .from('community_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Manually fetch profiles for created_by users
    const creatorIds = [...new Set(rawFiles?.map(f => f.created_by).filter(Boolean))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', creatorIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Map files with author info
    const files = rawFiles?.map(file => ({
      ...file,
      author: profileMap.get(file.created_by) || {
        full_name: 'Unknown',
        avatar_url: null
      }
    }));

    // If user is logged in, check which files they've downloaded
    if (userId && files) {
      const { data: downloads } = await supabase
        .from('community_file_downloads')
        .select('file_id')
        .eq('user_id', userId);

      const downloadedFileIds = new Set(downloads?.map(d => d.file_id) || []);

      return files.map(file => ({
        ...file,
        user_downloaded: downloadedFileIds.has(file.id)
      }));
    }

    return files?.map(file => ({
      ...file,
      user_downloaded: false
    })) || [];
  } catch (error) {
    console.error('Error fetching files:', error);
    return [];
  }
}

/**
 * Upload a file to Supabase Storage and create database record
 */
export async function uploadFile(
  file: File,
  metadata: {
    title: string;
    description: string;
    file_type: string;
    category: string;
    version: string;
    image_url?: string;
    tags?: string[];
  },
  adminId: string
): Promise<string | null> {
  try {
    // Upload file to Supabase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('community-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('community-files')
      .getPublicUrl(fileName);

    // Format file size
    const fileSize = formatFileSize(file.size);

    // Create database record
    const { data: fileId, error: dbError } = await supabase
      .rpc('upload_community_file', {
        p_title: metadata.title,
        p_description: metadata.description,
        p_file_type: metadata.file_type,
        p_category: metadata.category,
        p_file_size: fileSize,
        p_version: metadata.version,
        p_storage_path: fileName,
        p_file_url: publicUrl,
        p_image_url: metadata.image_url || null,
        p_tags: metadata.tags || [],
        p_created_by: adminId
      });

    if (dbError) throw dbError;
    return fileId;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

/**
 * Download a file and track the download
 */
export async function downloadFile(fileId: string, userId: string): Promise<{
  success: boolean;
  file_url: string | null;
  new_count: number;
} | null> {
  try {
    const { data, error } = await supabase
      .rpc('track_file_download', {
        p_file_id: fileId,
        p_user_id: userId
      });

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
}

/**
 * Delete a file (admin only)
 */
export async function deleteFile(fileId: string, adminId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('delete_community_file', {
        p_file_id: fileId,
        p_admin_id: adminId
      });

    if (error) throw error;

    // If successful, delete from storage
    if (data?.[0]?.success && data[0].storage_path) {
      await supabase.storage
        .from('community-files')
        .remove([data[0].storage_path]);
    }

    return data?.[0]?.success || false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Helper function to format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
