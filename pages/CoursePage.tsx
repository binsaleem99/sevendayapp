import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { COURSE_CONTENT } from '../constants';
import { getModules, getUserProgress, markLessonComplete, getLessonResources, getLastWatchedLesson } from '../services/courseService';
import { Play, CheckCircle, Menu, X, Trophy, Lock, Sparkles, FileText, Download, ArrowRight, ArrowLeft, CreditCard, Archive, FileSpreadsheet, Loader } from 'lucide-react';
import { Lesson, Module } from '../types';
import { Button } from '../components/Button';
import { VideoPlayer } from '../components/VideoPlayer';

// Helper component for confetti particles
const ConfettiBurst = () => {
  const particles = Array.from({ length: 24 }).map((_, i) => {
    const angle = (i / 24) * 360;
    const velocity = 40 + Math.random() * 60; // distance
    const tx = `${Math.cos(angle * Math.PI / 180) * velocity}px`;
    const ty = `${Math.sin(angle * Math.PI / 180) * velocity}px`;
    const rot = `${Math.random() * 360}deg`;
    const color = i % 2 === 0 ? '#CCFF00' : '#ffffff';
    
    return (
      <div 
        key={i} 
        className="confetti-piece"
        style={{ 
          '--tx': tx, 
          '--ty': ty,
          '--rot': rot,
          backgroundColor: color,
          animationDelay: `${Math.random() * 0.1}s`
        } as React.CSSProperties} 
      />
    );
  });
  return <>{particles}</>;
};

export const CoursePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, supabaseUser, refreshUser } = useAuth();
  const [courseModules, setCourseModules] = useState<Module[]>(COURSE_CONTENT);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Initialize sidebar based on screen width (Closed on mobile, Open on desktop)
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);

  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [recentlyUnlockedId, setRecentlyUnlockedId] = useState<string | null>(null);
  const [lessonResources, setLessonResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Flatten lessons for linear progression logic
  const allLessons = useMemo(() => courseModules.flatMap(m => m.lessons), [courseModules]);
  const FREE_LESSON_IDS = ['l1-1', 'l1-2'];

  // Fetch course data from Supabase
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setDataLoading(true);
        const modules = await getModules();

        if (modules && modules.length > 0) {
          setCourseModules(modules);
          // Set first lesson as active if not set
          if (!activeLesson && modules[0]?.lessons[0]) {
            setActiveLesson(modules[0].lessons[0]);
          }
        } else {
          // Fallback to constants if database is empty
          console.log('Using fallback course content from constants');
          setCourseModules(COURSE_CONTENT);
          if (!activeLesson) {
            setActiveLesson(COURSE_CONTENT[0].lessons[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        // Fallback to constants on error
        setCourseModules(COURSE_CONTENT);
        if (!activeLesson) {
          setActiveLesson(COURSE_CONTENT[0].lessons[0]);
        }
      } finally {
        setDataLoading(false);
      }
    };

    fetchCourseData();
  }, []);

  // Fetch user progress from Supabase
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (supabaseUser) {
        try {
          const progress = await getUserProgress(supabaseUser.id);
          setCompletedLessons(progress);
        } catch (error) {
          console.error('Error fetching user progress:', error);
          // Fallback to user.completedLessons from auth context
          if (user) {
            setCompletedLessons(user.completedLessons);
          }
        }
      } else if (user) {
        // Fallback for non-Supabase users
        setCompletedLessons(user.completedLessons);
      }
    };

    if (!authLoading) {
      fetchUserProgress();
    }
  }, [supabaseUser, user, authLoading]);

  // Removed redirect to login - users can browse course page freely

  useEffect(() => {
    const handleStorage = () => {
      refreshUser();
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshUser]);

  // Auto-resume last watched lesson
  useEffect(() => {
    const loadLastLesson = async () => {
      if (!supabaseUser || activeLesson || dataLoading) return; // Don't override if lesson already selected

      try {
        const lastLessonId = await getLastWatchedLesson(supabaseUser.id);

        if (lastLessonId && allLessons.length > 0) {
          const lesson = allLessons.find(l => l.id === lastLessonId);
          if (lesson && !isLessonLocked(lesson.id)) {
            console.log('📍 Resuming last watched lesson:', lesson.title);
            setActiveLesson(lesson);
            loadResources(lesson.id);
          }
        }
      } catch (error) {
        console.error('Error loading last watched lesson:', error);
      }
    };

    if (!dataLoading && allLessons.length > 0) {
      loadLastLesson();
    }
  }, [supabaseUser, dataLoading, allLessons.length]); // Only run when user is available and data is loaded

  // Handle Resize Events to toggle sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLessonComplete = async () => {
    if (activeLesson && !isCompleted(activeLesson.id) && supabaseUser) {
        setAnimatingId(activeLesson.id);

        const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);
        if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
            const nextLesson = allLessons[currentIndex + 1];
            if (!completedLessons.includes(nextLesson.id)) {
                setRecentlyUnlockedId(nextLesson.id);
                setTimeout(() => setRecentlyUnlockedId(null), 2000);
            }
        }

        // Save to Supabase database
        const success = await markLessonComplete(supabaseUser.id, activeLesson.id);

        if (success) {
          // Track lesson completed
          if (typeof window !== 'undefined' && (window as any).posthog) {
            (window as any).posthog.capture('lesson_completed', {
              lesson_id: activeLesson.id,
              lesson_title: activeLesson.title,
              completion_time: new Date().toISOString()
            });
          }

          // Update local state
          setCompletedLessons(prev => [...prev, activeLesson.id]);
          await refreshUser();
        } else {
          console.error('Failed to mark lesson complete');
        }

        setTimeout(() => {
          setAnimatingId(null);
        }, 800);
    }
  };

  const isCompleted = (lessonId: string) => completedLessons.includes(lessonId);
  const isAnimating = activeLesson && animatingId === activeLesson.id;
  const isGlobalAnimating = animatingId !== null;

  const isLessonLocked = (lessonId: string) => {
    // If user hasn't purchased, lock everything except the free lessons
    if (user && !user.hasPurchased) {
       return !FREE_LESSON_IDS.includes(lessonId);
    }

    const index = allLessons.findIndex(l => l.id === lessonId);
    if (index <= 0) return false;
    const prevLessonId = allLessons[index - 1].id;
    return !completedLessons.includes(prevLessonId);
  };

  // Loading skeleton
  if (dataLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-[#CCFF00] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">جاري تحميل المحتوى...</p>
        </div>
      </div>
    );
  }

  const handleLessonSelect = (lesson: Lesson) => {
    console.log('🎬 [COURSE PAGE] Lesson selected:', {
      lesson_id: lesson.id,
      lesson_title: lesson.title,
      user_hasPurchased: user?.hasPurchased,
      is_free_lesson: FREE_LESSON_IDS.includes(lesson.id)
    });

    // Check if gated for non-paying user
    if (user && !user.hasPurchased && !FREE_LESSON_IDS.includes(lesson.id)) {
      console.log('🔒 [COURSE PAGE] Lesson is locked, redirecting to checkout');
      alert('هذا الدرس مقفل. اشترك للوصول لجميع الدروس');
      navigate('/checkout');
      return;
    }

    if (isLessonLocked(lesson.id)) return;

    console.log('🔓 [COURSE PAGE] Lesson is unlocked, loading video');

    // Track lesson started
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('lesson_started', {
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        module_id: lesson.moduleId
      });
    }

    setActiveLesson(lesson);
    loadResources(lesson.id);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleNextLesson = () => {
    const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      handleLessonSelect(nextLesson);
    }
  };

  const handlePrevLesson = () => {
    const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);
    if (currentIndex > 0) {
      const prevLesson = allLessons[currentIndex - 1];
      handleLessonSelect(prevLesson);
    }
  };

  const loadResources = async (lessonId: string) => {
    setLoadingResources(true);
    try {
      const resources = await getLessonResources(lessonId);
      setLessonResources(resources);
    } catch (error) {
      console.error('Error loading resources:', error);
      setLessonResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleDownload = (resource: any) => {
    if (resource.file_url.startsWith('http')) {
      // Real URL - open in new tab
      window.open(resource.file_url, '_blank');
    } else {
      // Placeholder - show alert
      alert("سيتم إضافة الملفات قريباً");
    }
  };

  // Calculate progress
  const progress = Math.round((completedLessons.length / allLessons.length) * 100);
  const isCurrentLessonLocked = activeLesson ? isLessonLocked(activeLesson.id) : false;

  if (!user || !activeLesson) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-20 flex overflow-hidden font-body">
      
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:relative z-30 w-80 h-[calc(100vh-80px)] bg-[#111] border-l border-[#333] flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-[#333]">
           <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-white">محتوى الدورة</h2>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400">
                <X size={24} />
              </button>
           </div>
           
           {/* Progress Bar */}
           <div className="bg-[#222] h-2 rounded-full overflow-hidden mb-2">
             <div 
                className="bg-[#CCFF00] h-full transition-all duration-1000 ease-out relative"
                style={{ width: `${progress}%` }}
             >
                {isGlobalAnimating && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full animate-progress-pulse" />
                )}
             </div>
           </div>
           <div className="flex justify-between text-xs font-bold text-gray-500">
             <span>{progress}% مكتمل</span>
             <span>{completedLessons.length}/{allLessons.length} دروس</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
           {courseModules.map((module) => (
             <div key={module.id}>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 px-2 tracking-wider">
                  {module.title}
                </h3>
                <div className="space-y-1">
                  {module.lessons.map((lesson) => {
                    const isActive = activeLesson.id === lesson.id;
                    const completed = isCompleted(lesson.id);
                    const locked = isLessonLocked(lesson.id);
                    const isGated = !user.hasPurchased && !FREE_LESSON_IDS.includes(lesson.id);
                    const isJustUnlocked = recentlyUnlockedId === lesson.id;
                    
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonSelect(lesson)}
                        disabled={locked && !isGated} // Gated items are clickable to redirect
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-right transition-all duration-200 relative group overflow-hidden ${
                          isActive 
                            ? 'bg-[#CCFF00] text-black font-bold shadow-[0_0_15px_rgba(204,255,0,0.3)]' 
                            : isGated
                            ? 'bg-[#1a1a1a] text-[#FFD700] border border-[#FFD700]/20 hover:bg-[#FFD700]/10 cursor-pointer'
                            : locked 
                              ? 'opacity-50 cursor-not-allowed hover:bg-[#161616]' 
                              : 'hover:bg-[#222] text-gray-300 hover:text-white'
                        } ${isJustUnlocked ? 'animate-unlock-glow ring-2 ring-[#CCFF00]' : ''}`}
                      >
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${
                            isActive ? 'border-black' : isGated ? 'border-[#FFD700]' : 'border-gray-600'
                        }`}>
                          {completed ? (
                            <CheckCircle size={14} className={isActive ? 'text-black' : 'text-[#CCFF00]'} />
                          ) : isGated ? (
                            <CreditCard size={12} className="text-[#FFD700]" />
                          ) : locked ? (
                            <Lock size={12} />
                          ) : (
                            <Play size={10} fill="currentColor" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isActive ? 'font-bold' : ''}`}>
                            {isGated ? 'اشترك الآن للمشاهدة' : lesson.title}
                          </p>
                          <p className={`text-xs mt-0.5 ${isActive ? 'text-black/70' : 'text-gray-600'}`}>
                            {isGated ? 'وصول مقيد' : lesson.duration}
                          </p>
                        </div>

                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20" />}
                      </button>
                    );
                  })}
                </div>
             </div>
           ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[calc(100vh-80px)] overflow-hidden relative">
         <button 
           onClick={() => setSidebarOpen(true)}
           className={`md:hidden absolute top-4 right-4 z-10 bg-[#CCFF00] text-black p-2 shadow-lg ${sidebarOpen ? 'hidden' : 'block'}`}
         >
           <Menu size={24} />
         </button>

         <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto p-6 md:p-10">
               
               {/* Video Player Section */}
               <div className="mb-8">
                  <VideoPlayer 
                    videoUrl={activeLesson.videoUrl || ''}
                    lessonId={activeLesson.id}
                    lessonTitle={activeLesson.title}
                    onComplete={handleLessonComplete}
                  />

                  {/* Downloadable Resources Section */}
                  {!isCurrentLessonLocked && (
                    <div className="mt-6">
                        <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
                            📁 الملفات والمصادر
                        </h3>
                        <div className="bg-[#111] border border-[#333] rounded-lg p-4">
                            {loadingResources ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader className="w-6 h-6 text-[#CCFF00] animate-spin" />
                                <span className="text-gray-400 mr-3">جاري تحميل الملفات...</span>
                              </div>
                            ) : lessonResources.length > 0 ? (
                              <div className="grid gap-3">
                                {lessonResources.map((resource, i) => {
                                  const IconComponent = resource.icon === 'Archive' ? Archive : resource.icon === 'FileSpreadsheet' ? FileSpreadsheet : FileText;
                                  return (
                                    <div key={i} className="flex items-center p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors group">
                                      <IconComponent className="w-5 h-5 text-[#CCFF00] ml-4" />
                                      <div className="flex-1">
                                        <span className="text-gray-200 font-medium block">{resource.title}</span>
                                        {resource.description && (
                                          <span className="text-gray-500 text-xs">{resource.description}</span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => handleDownload(resource)}
                                        className="text-xs border border-[#CCFF00] text-[#CCFF00] px-4 py-1.5 rounded hover:bg-[#CCFF00] hover:text-black transition-all font-bold flex items-center gap-1"
                                      >
                                        <Download size={14} />
                                        تحميل
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">لا توجد ملفات مرفقة لهذا الدرس</p>
                              </div>
                            )}
                        </div>
                    </div>
                  )}
               </div>

               {/* Lesson Info */}
               <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10 border-b border-[#333] pb-8">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2 leading-tight">
                        {activeLesson.title}
                    </h1>
                    <p className="text-gray-400">
                        الدرس {allLessons.findIndex(l => l.id === activeLesson.id) + 1} من {allLessons.length}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                     {/* Navigation Arrows */}
                     <div className="flex gap-2">
                        <button 
                            onClick={handlePrevLesson}
                            disabled={allLessons.findIndex(l => l.id === activeLesson.id) === 0}
                            className="p-3 border border-[#333] hover:border-[#CCFF00] hover:text-[#CCFF00] disabled:opacity-30 disabled:hover:border-[#333] disabled:hover:text-inherit transition-all"
                        >
                            <ArrowRight size={20} />
                        </button>
                        <button 
                            onClick={handleNextLesson}
                            disabled={allLessons.findIndex(l => l.id === activeLesson.id) === allLessons.length - 1}
                            className="p-3 border border-[#333] hover:border-[#CCFF00] hover:text-[#CCFF00] disabled:opacity-30 disabled:hover:border-[#333] disabled:hover:text-inherit transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                     </div>

                     <Button 
                        onClick={handleLessonComplete}
                        disabled={isCompleted(activeLesson.id)}
                        variant={isCompleted(activeLesson.id) ? 'outline' : 'primary'}
                        className={`relative overflow-visible min-w-[180px] ${isAnimating ? 'animate-celebrate-pop' : ''}`}
                     >
                        {isCompleted(activeLesson.id) ? (
                            <span className="flex items-center gap-2">
                                <CheckCircle size={18} /> مكتمل
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                إكمال الدرس {isAnimating && <Sparkles size={16} className="animate-spin" />}
                            </span>
                        )}
                        
                        {/* Confetti Origin */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
                             {isAnimating && <ConfettiBurst />}
                        </div>
                        
                        {/* Ring Animation */}
                        {isAnimating && <div className="animate-ring-expand border-[#CCFF00]"></div>}
                     </Button>
                  </div>
               </div>

               {/* Resources Section */}
               <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-8">
                     <section>
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-[#CCFF00]" /> وصف الدرس
                        </h3>
                        <div className="bg-[#111] p-6 border border-[#333] text-gray-400 leading-relaxed text-sm">
                            <p className="mb-4">
                                في هذا الدرس المكثف، سنتناول الاستراتيجيات الأساسية التي ستمكنك من الانتقال من مجرد فكرة خام إلى خطة عمل قابلة للتنفيذ. سنركز على الأدوات العملية التي توفر عليك الوقت والمال.
                            </p>
                            <p>
                                تأكد من تحميل الملفات المرفقة ومراجعة قائمة المهام قبل الانتقال للدرس التالي. التطبيق العملي هو المفتاح هنا.
                            </p>
                        </div>
                     </section>
                  </div>

                  <div className="space-y-6">
                     <section>
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Download size={20} className="text-[#CCFF00]" /> المرفقات
                        </h3>
                        <div className="space-y-2">
                            {['ملف العرض (PDF)', 'قائمة المصادر', 'قالب العمل'].map((file, i) => (
                                <a key={i} href="#" className="block bg-[#161616] p-4 border border-[#333] hover:border-[#CCFF00] hover:bg-[#1a1a1a] transition-all group">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{file}</span>
                                        <Download size={14} className="text-gray-600 group-hover:text-[#CCFF00]" />
                                    </div>
                                </a>
                            ))}
                        </div>
                     </section>

                     <div className="bg-[#CCFF00]/5 border border-[#CCFF00]/20 p-6 relative overflow-hidden">
                        <Trophy className="text-[#CCFF00] w-12 h-12 mb-2 opacity-80" />
                        <h4 className="font-bold text-white mb-1">نصيحة ذهبية</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            لا تحاول أن تكون مثالياً من المحاولة الأولى. السرعة في التنفيذ أهم من الكمال في هذه المرحلة.
                        </p>
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </main>
    </div>
  );
}