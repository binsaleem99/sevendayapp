import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, MessageSquare, Calendar as CalendarIcon, File, Lock, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getPosts,
  createPost,
  createComment,
  CommunityPost as ServicePost
} from '../services/communityService';
import { supabase } from '../lib/supabase';
import PostCard from '../components/community/PostCard';
import CommunitySidebar from '../components/community/CommunitySidebar';
import NewPostComposer from '../components/community/NewPostComposer';
import CommunityCalendar from '../components/community/CommunityCalendar';
import FileHub from '../components/community/FileHub';
import AdminManagement from '../components/community/AdminManagement';
import { Post, CommunityStats, CalendarEvent, FileItem } from '../types/community';

type TabType = 'posts' | 'calendar' | 'files' | 'management';

const CommunityAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, supabaseUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<CommunityStats>({
    total_members: 0,
    online_now: 0,
    admins_count: 0,
    total_posts: 0
  });
  const hasAccess = true; // Community is FREE for all users
  const [loading, setLoading] = useState(true);
  const [showNewPostComposer, setShowNewPostComposer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ADMIN PROTECTION - Redirect non-admins
  useEffect(() => {
    if (!loading) {
      if (!supabaseUser) {
        navigate('/login');
        return;
      }
      if (!profile?.is_community_admin && profile?.role !== 'admin') {
        navigate('/community'); // Redirect to public community
        return;
      }
    }
  }, [supabaseUser, profile, loading, navigate]);

  useEffect(() => {
    loadData();
  }, [supabaseUser]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load posts
      const postsData = await getPosts();

      // Transform posts to match our type
      const transformedPosts: Post[] = postsData.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        title: p.title,
        content: p.content,
        image_url: p.image_url,
        is_pinned: p.is_pinned,
        category: 'general' as const,
        likes_count: p.likes_count,
        comments_count: p.comments_count,
        created_at: formatDate(p.created_at),
        is_locked: false, // Community is FREE - all posts visible
        author: {
          full_name: p.author?.full_name || 'مستخدم',
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.author?.full_name || 'User')}&background=CCFF00&color=000`,
          level: 1,
          is_admin: false
        },
        comments: []
      }));

      setPosts(transformedPosts);

      // Load community stats
      await loadStats();

      // Load events
      await loadEvents();

      // Load files
      await loadFiles();

    } catch (err) {
      console.error('Error loading community:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get total members
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('has_community_access', true);

      // Get total posts
      const { count: totalPosts } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true });

      // Get admins count
      const { count: adminsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_community_admin', true);

      setStats({
        total_members: totalMembers || 0,
        online_now: Math.floor((totalMembers || 0) * 0.15), // Simulate 15% online
        admins_count: adminsCount || 1,
        total_posts: totalPosts || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('community_events')
        .select('*')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(5);

      if (error) throw error;

      const transformedEvents: CalendarEvent[] = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: event.event_date,
        time: event.event_time || '',
        attendees_count: event.attendees_count || 0,
        image_url: event.image_url,
        is_online: event.is_online ?? true
      }));

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('community_files')
        .select(`
          *,
          author:profiles!created_by(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const transformedFiles: FileItem[] = (data || []).map(file => ({
        id: file.id,
        title: file.title,
        description: file.description || '',
        version: file.version || 'v1.0',
        download_count: file.download_count || 0,
        size: file.file_size || '',
        upload_date: file.created_at,
        image_url: file.image_url,
        author: {
          name: file.author?.full_name || 'مستخدم',
          avatar: file.author?.avatar_url || `https://ui-avatars.com/api/?name=User&background=CCFF00&color=000`
        },
        comments: []
      }));

      setFiles(transformedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'منذ دقائق';
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const days = Math.floor(diffHours / 24);
    if (days === 1) return 'منذ يوم واحد';
    return `منذ ${days} يوم`;
  };


  const handleCreatePost = async (data: { title: string; content: string; category: string; imageUrl?: string }) => {
    if (!supabaseUser) return;

    setSubmitting(true);
    try {
      const newPost = await createPost(supabaseUser.id, data.title, data.content);
      if (newPost) {
        // Transform and add to list
        const transformedPost: Post = {
          id: newPost.id,
          user_id: newPost.user_id,
          title: newPost.title,
          content: newPost.content,
          image_url: data.imageUrl,
          is_pinned: false,
          category: data.category as any,
          likes_count: 0,
          comments_count: 0,
          created_at: 'منذ دقائق',
          is_locked: false,
          author: {
            full_name: profile?.full_name || 'مستخدم',
            avatar_url: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=CCFF00&color=000`,
            level: profile?.community_level || 1,
            is_admin: profile?.is_community_admin || false
          },
          comments: []
        };

        setPosts([transformedPost, ...posts]);
        setShowNewPostComposer(false);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!supabaseUser) {
      navigate('/login');
      return;
    }

    try {
      // Toggle like
      const { data: existingLike } = await supabase
        .from('community_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', supabaseUser.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('community_likes')
          .delete()
          .eq('id', existingLike.id);

        setPosts(posts.map(p =>
          p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p
        ));
      } else {
        // Like
        await supabase
          .from('community_likes')
          .insert({ post_id: postId, user_id: supabaseUser.id });

        setPosts(posts.map(p =>
          p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleRegisterEvent = async (eventId: string) => {
    if (!supabaseUser) {
      navigate('/login');
      return;
    }

    try {
      await supabase
        .from('community_event_registrations')
        .insert({ event_id: eventId, user_id: supabaseUser.id });

      // Update local state
      setEvents(events.map(e =>
        e.id === eventId ? { ...e, attendees_count: e.attendees_count + 1 } : e
      ));
    } catch (error) {
      console.error('Error registering for event:', error);
    }
  };

  const handleDownloadFile = async (fileId: string) => {
    if (!supabaseUser) {
      navigate('/login');
      return;
    }

    try {
      // Increment download count
      await supabase.rpc('increment_download_count', { file_id: fileId });

      // Update local state
      setFiles(files.map(f =>
        f.id === fileId ? { ...f, download_count: f.download_count + 1 } : f
      ));

      // Get file URL and open
      const file = files.find(f => f.id === fileId);
      if (file) {
        window.open(file.image_url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Show loading while checking auth or loading data
  if (loading || (supabaseUser && !profile?.is_community_admin && profile?.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <Loader className="animate-spin text-[#CCFF00]" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 px-6 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'posts'
                      ? 'bg-[#CCFF00] text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>المنشورات</span>
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`flex-1 px-6 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'calendar'
                      ? 'bg-[#CCFF00] text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CalendarIcon className="w-5 h-5" />
                  <span>الفعاليات</span>
                </button>
                <button
                  onClick={() => setActiveTab('files')}
                  className={`flex-1 px-6 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'files'
                      ? 'bg-[#CCFF00] text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <File className="w-5 h-5" />
                  <span>الملفات</span>
                </button>
                <button
                  onClick={() => setActiveTab('management')}
                  className={`flex-1 px-6 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'management'
                      ? 'bg-[#CCFF00] text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span>إدارة المشرفين</span>
                </button>
              </div>
            </div>

            {/* New Post Composer (only for logged-in users on posts tab) */}
            {activeTab === 'posts' && supabaseUser && (
              <NewPostComposer onSubmit={handleCreatePost} isLoading={submitting} />
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={() => handleLikePost(post.id)}
                  />
                ))}

                {posts.length === 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400">لا توجد منشورات بعد</p>
                  </div>
                )}
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <CommunityCalendar
                events={events}
                onRegister={handleRegisterEvent}
              />
            )}

            {/* Files Tab */}
            {activeTab === 'files' && (
              <FileHub
                files={files}
                onDownload={handleDownloadFile}
              />
            )}

            {/* Management Tab */}
            {activeTab === 'management' && supabaseUser && (
              <AdminManagement currentUserId={supabaseUser.id} />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CommunitySidebar
              stats={stats}
              hasAccess={true}
              subscriptionStatus={null}
              trialDaysLeft={0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityAdminPage;
