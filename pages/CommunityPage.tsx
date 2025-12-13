import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Calendar, FileText, Loader, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import PostCard from '../components/community/PostCard';
import NewPostComposer from '../components/community/NewPostComposer';
import CommunitySidebar from '../components/community/CommunitySidebar';
import CommunityCalendar from '../components/community/CommunityCalendar';
import FileHub from '../components/community/FileHub';
import { Post, CommunityStats } from '../types/community';
import {
  getCommentsForPost,
  toggleCommentLike,
  togglePostLike,
  togglePostPin,
  deletePost,
  createComment,
  getEvents,
  createEvent,
  registerForEvent,
  unregisterFromEvent,
  getFiles,
  uploadFile,
  downloadFile,
  deleteFile
} from '../services/communityService';
import CreateEventModal from '../components/community/CreateEventModal';
import FileUploadModal from '../components/community/FileUploadModal';

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'files'>('posts');
  const [activeFilter, setActiveFilter] = useState('general');
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<CommunityStats>({
    total_members: 0,
    online_now: 0,
    admins_count: 0,
    total_posts: 0
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [postComments, setPostComments] = useState<{ [postId: string]: any[] }>({});
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<any[]>([]);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);

  // Check if user is admin (for showing admin link)
  const isAdmin = profile?.is_community_admin || profile?.role === 'admin';

  const filters = [
    { id: 'general', label: 'عام' },
    { id: 'announcements', label: 'إعلانات' },
    { id: 'success', label: 'قصص نجاح' },
    { id: 'help', label: 'مساعدة' }
  ];

  useEffect(() => {
    loadData();
    loadEvents();
    loadFiles();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load posts
      const { data: postsData } = await supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles!user_id(
            full_name,
            avatar_url,
            community_level,
            is_community_admin
          )
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (postsData) {
        setPosts(postsData.map((post: any) => ({
          id: post.id,
          user_id: post.user_id,
          title: post.title,
          content: post.content,
          image_url: post.image_url,
          is_pinned: post.is_pinned || false,
          category: post.category || 'general',
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          created_at: formatDate(post.created_at),
          is_locked: false,
          participants: [],
          author: {
            full_name: post.author?.full_name || 'مستخدم',
            avatar_url: post.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.full_name || 'User')}&background=CCFF00&color=000`,
            level: post.author?.community_level || 1,
            is_admin: post.author?.is_community_admin || false
          }
        })));
      }

      // Load stats
      const { count: memberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: postCount } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true });

      const { count: adminCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_community_admin', true);

      setStats({
        total_members: memberCount || 0,
        online_now: Math.max(1, Math.floor((memberCount || 0) * 0.1)),
        admins_count: Math.max(1, adminCount || 0),
        total_posts: postCount || 0
      });

    } catch (err) {
      console.error('Error loading community:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-KW');
  };

  const handleLoadComments = async (postId: string) => {
    try {
      const comments = await getCommentsForPost(postId, user?.id || null);
      setPostComments(prev => ({ ...prev, [postId]: comments }));
      setExpandedPosts(prev => new Set(prev).add(postId));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await createComment(postId, user.id, content);
      await handleLoadComments(postId);

      // Update comments count in posts
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
      ));

      // Track with PostHog
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('community_comment_created', { post_id: postId });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleLikeComment = async (postId: string, commentId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const result = await toggleCommentLike(commentId, user.id);
      if (result) {
        // Update the comment in local state
        setPostComments(prev => ({
          ...prev,
          [postId]: prev[postId]?.map(c =>
            c.id === commentId
              ? { ...c, likes_count: result.newCount, user_liked: result.liked }
              : c
          ) || []
        }));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const result = await togglePostLike(postId, user.id);
      if (result) {
        setPosts(posts.map(p =>
          p.id === postId ? { ...p, likes_count: result.newCount } : p
        ));

        // Track with PostHog
        if (typeof window !== 'undefined' && (window as any).posthog) {
          (window as any).posthog.capture('community_post_liked', { post_id: postId, liked: result.liked });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handlePinPost = async (postId: string) => {
    if (!user || !isAdmin) return;

    try {
      const success = await togglePostPin(postId, user.id);
      if (success) {
        setPosts(posts.map(p =>
          p.id === postId ? { ...p, is_pinned: !p.is_pinned } : p
        ));
      }
    } catch (error) {
      console.error('Error pinning post:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;

    try {
      const success = await deletePost(postId, user.id);
      if (success) {
        setPosts(posts.filter(p => p.id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // ============ EVENTS HANDLERS ============

  const loadEvents = async () => {
    try {
      const eventsData = await getEvents(user?.id || null);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    if (!user || !isAdmin) return;

    try {
      const eventId = await createEvent(eventData, user.id);
      if (eventId) {
        // Track with PostHog
        if (typeof window !== 'undefined' && (window as any).posthog) {
          (window as any).posthog.capture('community_event_created', {
            event_type: eventData.event_type,
            is_online: eventData.is_online,
            has_capacity_limit: !!eventData.max_attendees
          });
        }

        await loadEvents();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleRegisterForEvent = async (eventId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const result = await registerForEvent(eventId, user.id);
      if (result?.success) {
        // Update local state
        setEvents(events.map(e =>
          e.id === eventId
            ? { ...e, is_registered: true, attendees_count: result.attendees_count }
            : e
        ));

        // Track with PostHog
        if (typeof window !== 'undefined' && (window as any).posthog) {
          (window as any).posthog.capture('community_event_registered', { event_id: eventId });
        }
      } else if (result?.message) {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error registering for event:', error);
    }
  };

  const handleUnregisterFromEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const result = await unregisterFromEvent(eventId, user.id);
      if (result?.success) {
        // Update local state
        setEvents(events.map(e =>
          e.id === eventId
            ? { ...e, is_registered: false, attendees_count: result.attendees_count }
            : e
        ));
      }
    } catch (error) {
      console.error('Error unregistering from event:', error);
    }
  };

  // ============ FILES HANDLERS ============

  const loadFiles = async () => {
    try {
      const filesData = await getFiles(user?.id || null);
      setFiles(filesData);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const handleUploadFile = async (file: File, metadata: any) => {
    if (!user || !isAdmin) return;

    try {
      const fileId = await uploadFile(file, metadata, user.id);
      if (fileId) {
        // Track with PostHog
        if (typeof window !== 'undefined' && (window as any).posthog) {
          (window as any).posthog.capture('community_file_uploaded', {
            file_type: metadata.file_type,
            category: metadata.category,
            file_size: file.size
          });
        }

        await loadFiles();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDownloadFile = async (fileId: string, fileUrl: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const result = await downloadFile(fileId, user.id);
      if (result?.success && result.file_url) {
        // Update local state
        setFiles(files.map(f =>
          f.id === fileId
            ? { ...f, download_count: result.new_count, user_downloaded: true }
            : f
        ));

        // Open file in new tab
        window.open(result.file_url, '_blank');

        // Track with PostHog
        if (typeof window !== 'undefined' && (window as any).posthog) {
          (window as any).posthog.capture('community_file_downloaded', { file_id: fileId });
        }
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!user || !isAdmin) return;

    try {
      const success = await deleteFile(fileId, user.id);
      if (success) {
        setFiles(files.filter(f => f.id !== fileId));
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleCreatePost = async (data: { title: string; content: string; category: string; imageUrl?: string }) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      // CRITICAL FIX: Force session refresh to ensure auth.uid() is set properly
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        alert('انتهت جلستك. يرجى تسجيل الدخول مجدداً');
        navigate('/login');
        return;
      }

      console.log('[Post Creation] Session user ID:', session.user.id);
      console.log('[Post Creation] Context user ID:', user.id);

      const { data: newPost, error } = await supabase.from('community_posts').insert({
        user_id: session.user.id,  // Use session.user.id to ensure it matches auth.uid()
        title: data.title,
        content: data.content,
        image_url: data.imageUrl,
        category: data.category || 'general'
      }).select().single();

      if (error) {
        console.error('Error creating post:', error);
        alert(`فشل إنشاء المنشور: ${error.message}`);
        return;
      }

      console.log('✅ Post created successfully:', newPost);

      // Track with PostHog
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('community_post_created', {
          category: data.category,
          has_image: !!data.imageUrl
        });
      }

      loadData(); // Reload all data
    } catch (error) {
      console.error('Exception creating post:', error);
      alert('حدث خطأ غير متوقع أثناء إنشاء المنشور');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedPosts = posts.filter(post => {
    if (activeFilter === 'general') return true;
    return post.category === activeFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center pt-20">
        <Loader className="animate-spin text-[#CCFF00]" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-20" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Sidebar (Right in RTL) */}
          <div className="lg:col-span-4 order-first lg:order-last">
            <div className="sticky top-24 space-y-4">
              <CommunitySidebar stats={stats} hasAccess={true} subscriptionStatus={null} trialDaysLeft={0} />

              {/* Admin Link - Only for admins */}
              {isAdmin && (
                <Link
                  to="/community/admin"
                  className="flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl p-4 hover:bg-gray-800 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-bold">لوحة إدارة المجتمع</span>
                </Link>
              )}
            </div>
          </div>

          {/* Main Content (Left in RTL) */}
          <div className="lg:col-span-8">

            {/* Main Tabs: Posts, Events, Files */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all border-b-2 ${
                    activeTab === 'posts'
                      ? 'text-gray-900 border-[#CCFF00] bg-[#CCFF00]/5'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>المنشورات</span>
                </button>
                <button
                  onClick={() => setActiveTab('events')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all border-b-2 ${
                    activeTab === 'events'
                      ? 'text-gray-900 border-[#CCFF00] bg-[#CCFF00]/5'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  <span>الفعاليات</span>
                </button>
                <button
                  onClick={() => setActiveTab('files')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all border-b-2 ${
                    activeTab === 'files'
                      ? 'text-gray-900 border-[#CCFF00] bg-[#CCFF00]/5'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>الملفات</span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'posts' && (
              <>
                {/* Post Composer - Only for logged in users */}
                {user && (
                  <div className="mb-6">
                    <NewPostComposer onSubmit={handleCreatePost} isLoading={submitting} />
                  </div>
                )}

                {/* Not logged in message */}
                {!user && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6 text-center">
                    <p className="text-gray-600 mb-4">سجل دخولك للمشاركة في المجتمع</p>
                    <button
                      onClick={() => navigate('/login')}
                      className="bg-[#CCFF00] text-gray-900 font-bold px-6 py-2 rounded-lg hover:bg-[#b8e600] transition-colors"
                    >
                      تسجيل الدخول
                    </button>
                  </div>
                )}

                {/* Category Filters */}
                <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
                  {filters.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`px-5 py-2 rounded-full text-sm whitespace-nowrap transition-all font-bold border ${
                        activeFilter === filter.id
                          ? 'bg-[#CCFF00] text-gray-900 border-[#CCFF00]'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Posts List */}
                <div className="space-y-4">
                  {displayedPosts.length > 0 ? (
                    displayedPosts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={() => handleLike(post.id)}
                        onLoadComments={handleLoadComments}
                        onAddComment={handleAddComment}
                        onLikeComment={handleLikeComment}
                        comments={postComments[post.id] || []}
                        isAdmin={isAdmin}
                        onPin={handlePinPost}
                        onDelete={handleDeletePost}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">لا توجد منشورات بعد</p>
                      {user && (
                        <p className="text-gray-400 text-sm mt-2">كن أول من يشارك!</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'events' && (
              <>
                <CommunityCalendar
                  events={events}
                  onRegister={handleRegisterForEvent}
                  onUnregister={handleUnregisterFromEvent}
                  onCreateEvent={isAdmin ? () => setShowCreateEventModal(true) : undefined}
                  isAdmin={isAdmin}
                />
              </>
            )}

            {activeTab === 'files' && (
              <FileHub
                files={files}
                onDownload={handleDownloadFile}
                onDelete={handleDeleteFile}
                onUpload={isAdmin ? () => setShowFileUploadModal(true) : undefined}
                isAdmin={isAdmin}
              />
            )}

          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        onSubmit={handleCreateEvent}
      />

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={showFileUploadModal}
        onClose={() => setShowFileUploadModal(false)}
        onSubmit={handleUploadFile}
      />
    </div>
  );
};

export default CommunityPage;
