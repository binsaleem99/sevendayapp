import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // State management
  const [activeFilter, setActiveFilter] = useState('posts'); // 'posts' | 'events' | 'files'
  const [activeCategory, setActiveCategory] = useState('general'); // For posts subcategories
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

  const isAdmin = profile?.is_community_admin || profile?.role === 'admin';

  // Main filters (tabs)
  const filters = [
    { id: 'posts', label: 'المنشورات' },
    { id: 'events', label: 'الفعاليات' },
    { id: 'files', label: 'الملفات' }
  ];

  // Category filters for posts
  const categoryFilters = [
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
            avatar_url: post.author?.avatar_url || null,
            level: post.author?.community_level || 1,
            is_admin: post.author?.is_community_admin || false
          }
        })));
      }

      // Load community stats
      const { count: membersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: postsCount } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true });

      const { count: adminsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_community_admin', true);

      setStats({
        total_members: membersCount || 0,
        online_now: Math.floor((membersCount || 0) * 0.15),
        admins_count: adminsCount || 0,
        total_posts: postsCount || 0
      });

    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const eventsData = await getEvents();
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadFiles = async () => {
    try {
      const filesData = await getFiles();
      setFiles(filesData || []);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-SA');
  };

  const handleCreatePost = async (data: { title: string; content: string; category: string; imageUrl?: string }) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      // Force session refresh to ensure auth.uid() is set properly
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
        user_id: session.user.id,
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

      loadData();
    } catch (error) {
      console.error('Exception creating post:', error);
      alert('حدث خطأ غير متوقع أثناء إنشاء المنشور');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    await togglePostLike(postId);
    loadData();
  };

  const handleLoadComments = async (postId: string) => {
    const comments = await getCommentsForPost(postId);
    setPostComments(prev => ({ ...prev, [postId]: comments }));
    setExpandedPosts(prev => new Set(prev).add(postId));
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    await createComment(postId, content);
    await handleLoadComments(postId);
    loadData();
  };

  const handleLikeComment = async (commentId: string, postId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    await toggleCommentLike(commentId);
    await handleLoadComments(postId);
  };

  const handlePinPost = async (postId: string) => {
    await togglePostPin(postId);
    loadData();
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنشور؟')) {
      await deletePost(postId);
      loadData();
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      await createEvent(eventData);
      setShowCreateEventModal(false);
      loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('فشل إنشاء الفعالية');
    }
  };

  const handleRegisterForEvent = async (eventId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    await registerForEvent(eventId);
    loadEvents();
  };

  const handleUnregisterFromEvent = async (eventId: string) => {
    await unregisterFromEvent(eventId);
    loadEvents();
  };

  const handleUploadFile = async (fileData: any) => {
    try {
      await uploadFile(fileData);
      setShowFileUploadModal(false);
      loadFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('فشل رفع الملف');
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    await downloadFile(fileId, fileName);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الملف؟')) {
      await deleteFile(fileId);
      loadFiles();
    }
  };

  // Filter posts by category when on posts tab
  const displayedPosts = activeFilter === 'posts'
    ? posts.filter(post => post.category === activeCategory)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#CCFF00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Sidebar Column (Right in RTL) */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-24">
            <CommunitySidebar stats={stats} />
          </div>
        </div>

        {/* Main Content Column (Left in RTL) */}
        <div className="lg:col-span-8">

          {/* Main Tab Filters - المنشورات | الفعاليات | الملفات */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-6 py-2 rounded-full text-sm whitespace-nowrap transition-all font-bold border ${
                  activeFilter === filter.id
                    ? 'bg-[#CCFF00] text-gray-900 border-[#CCFF00]'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Content Area Based on Active Filter */}
          {activeFilter === 'posts' && (
            <>
              {/* Post Composer - Only for logged in users */}
              {user ? (
                <div className="mb-6">
                  <NewPostComposer onSubmit={handleCreatePost} isLoading={submitting} />
                </div>
              ) : (
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

              {/* Category Sub-filters for Posts */}
              <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
                {categoryFilters.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveCategory(filter.id)}
                    className={`px-5 py-2 rounded-full text-sm whitespace-nowrap transition-all font-bold border ${
                      activeCategory === filter.id
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
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                    <p className="text-gray-400 font-medium">لا توجد منشورات في هذا القسم بعد</p>
                    {user && (
                      <p className="text-gray-400 text-sm mt-2">كن أول من يشارك!</p>
                    )}
                  </div>
                )}

                {displayedPosts.length > 0 && (
                  <div className="mt-8 text-center pb-10">
                    <p className="text-gray-400 text-sm">لقد وصلت إلى نهاية المنشورات</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeFilter === 'events' && (
            <div className="animate-in fade-in duration-300">
              <CommunityCalendar
                events={events}
                onRegister={handleRegisterForEvent}
                onUnregister={handleUnregisterFromEvent}
                onCreateEvent={isAdmin ? () => setShowCreateEventModal(true) : undefined}
                isAdmin={isAdmin}
              />
            </div>
          )}

          {activeFilter === 'files' && (
            <div className="animate-in fade-in duration-300">
              <FileHub
                files={files}
                onDownload={handleDownloadFile}
                onDelete={handleDeleteFile}
                onUpload={isAdmin ? () => setShowFileUploadModal(true) : undefined}
                isAdmin={isAdmin}
              />
            </div>
          )}

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
