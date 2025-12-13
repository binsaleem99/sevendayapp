import React, { useState } from 'react';
import PostCard from './PostCard';
import NewPostComposer from './NewPostComposer';
import CommunitySidebar from './CommunitySidebar';
import Calendar from './Calendar';
import FileHub from './FileHub';
import { Post, CommunityStats } from '../types';
import { Send, Mail } from 'lucide-react';

const CommunityPage: React.FC = () => {
  // Default to 'general'
  const [activeFilter, setActiveFilter] = useState('general');

  const stats: CommunityStats = {
    total_members: 1240,
    online_now: 85,
    admins_count: 4,
    total_posts: 3420
  };

  const filters = [
    { id: 'general', label: 'نقاش عام' },
    { id: 'success', label: 'قصص نجاح' },
    { id: 'calendar', label: 'التقويم' },
    { id: 'files', label: 'ملفات' },
    { id: 'help', label: 'مساعدة' }
  ];

  const allPosts: Post[] = [
    {
      id: '1',
      user_id: 'u1',
      author: {
        full_name: 'أحمد محمد',
        avatar_url: 'https://picsum.photos/seed/ahmed/100/100',
        level: 8,
        is_admin: true
      },
      title: 'أهلاً بكم في مجتمع داي آب! 🚀',
      content: 'نحن سعداء جداً بانضمامكم إلينا. هذا المجتمع مخصص لمساعدتكم في رحلتكم التعليمية.',
      category: 'general',
      created_at: 'منذ يومين',
      is_pinned: true,
      likes_count: 45,
      comments_count: 12,
      participants: ['https://picsum.photos/seed/p1/50/50'],
      comments: []
    },
    {
      id: '2',
      user_id: 'u3',
      author: {
        full_name: 'خالد عمر',
        avatar_url: 'https://picsum.photos/seed/khaled/100/100',
        level: 2,
        is_admin: false
      },
      title: 'كيف أبدأ في تعلم React؟',
      content: 'مرحباً جميعاً، أنا جديد في عالم البرمجة وأريد تعلم React.',
      category: 'general',
      created_at: 'منذ 3 ساعات',
      is_pinned: false,
      likes_count: 8,
      comments_count: 3,
      participants: ['https://picsum.photos/seed/p4/50/50', 'https://picsum.photos/seed/p5/50/50'],
      is_locked: true
    },
    {
        id: '4',
        user_id: 'u5',
        author: {
          full_name: 'منى عبدالله',
          avatar_url: 'https://picsum.photos/seed/mona/100/100',
          level: 5,
          is_admin: false
        },
        title: 'تجربتي في إطلاق تطبيقي الأول',
        content: 'اليوم أتممت رفع تطبيقي الأول على المتجر! الرحلة كانت شاقة ولكن ممتعة.',
        image_url: 'https://picsum.photos/seed/app/800/400',
        category: 'success',
        created_at: 'منذ 6 ساعات',
        is_pinned: true, // Pinned success story
        likes_count: 34,
        comments_count: 8,
        participants: [],
        is_locked: false
    }
  ];

  // Logic to filter posts
  const displayedPosts = allPosts.filter(post => {
    if (activeFilter === 'general') return post.category === 'general';
    if (activeFilter === 'success') return post.is_pinned; // Success stories are pinned posts from general/any
    return false;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Column (Right) */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-24">
             <CommunitySidebar stats={stats} />
          </div>
        </div>

        {/* Main Content Column (Left) */}
        <div className="lg:col-span-8">
          
          {/* Only show composer on feed views, not help/calendar/files */}
          {activeFilter === 'general' && <NewPostComposer />}

          {/* Filters/Tabs */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-6 py-2 rounded-full text-sm whitespace-nowrap transition-all font-bold border ${
                  activeFilter === filter.id
                    ? 'bg-lime-accent text-gray-900 border-lime-accent'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Content Area Switcher */}
          {activeFilter === 'help' ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-lime-700" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">تواصل معنا</h2>
                <p className="text-gray-500">هل تواجه مشكلة؟ نحن هنا لمساعدتك. املأ النموذج أدناه.</p>
              </div>

              <form className="space-y-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الاسم الكامل</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-colors" placeholder="أدخل اسمك" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
                  <input type="email" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-colors" placeholder="name@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">رسالتك</label>
                  <textarea rows={5} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-colors resize-none" placeholder="اكتب تفاصيل مشكلتك هنا..." />
                </div>
                <button className="w-full bg-lime-accent hover:bg-lime-hover text-gray-900 font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 mt-4 shadow-sm">
                  <Send className="w-4 h-4" />
                  <span>إرسال الرسالة</span>
                </button>
              </form>
            </div>
          ) : activeFilter === 'calendar' ? (
            <div className="animate-in fade-in duration-300">
              <Calendar />
            </div>
          ) : activeFilter === 'files' ? (
            <div className="animate-in fade-in duration-300">
              <FileHub />
            </div>
          ) : (
            /* Posts Feed for General and Success */
            <div className="space-y-4">
              {displayedPosts.length > 0 ? (
                displayedPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                  <p className="text-gray-400 font-medium">لا توجد منشورات في هذا القسم بعد</p>
                </div>
              )}
              
              {displayedPosts.length > 0 && (
                <div className="mt-8 text-center pb-10">
                    <p className="text-gray-400 text-sm">لقد وصلت إلى نهاية المنشورات</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CommunityPage;
