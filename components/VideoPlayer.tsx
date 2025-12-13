import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX, Settings, Video, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateWatchProgress } from '../services/courseService';

interface VideoPlayerProps {
  videoUrl: string;
  lessonId: string;
  lessonTitle: string;
  onComplete: () => void;
  onProgress?: (percent: number) => void;
}

// Helper to get embed URL
const getEmbedUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
  }
  if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return url;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  lessonId,
  lessonTitle,
  onComplete,
  onProgress
}) => {
  const { supabaseUser } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [resumeTime, setResumeTime] = useState<number | null>(null);

  // Track milestones
  const [milestonesReached, setMilestonesReached] = useState<Set<number>>(new Set());

  // Simulation of progress for tracking purposes
  // In a real production app with YouTube API, we would hook into 'onStateChange'
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Constants for simulation
  const SIMULATED_DURATION = 600; // 10 minutes in seconds

  useEffect(() => {
    // Check local storage for saved position
    const savedTime = localStorage.getItem(`video-progress-${lessonId}`);
    if (savedTime) {
      const time = parseInt(savedTime, 10);
      if (time > 10 && time < SIMULATED_DURATION - 30) {
        setResumeTime(time);
        setSimulatedProgress(time);
      }
    } else {
      setResumeTime(null);
      setSimulatedProgress(0);
    }
    
    // Reset state on lesson change
    setIsPlaying(false);
    setHasStarted(false);
    setMilestonesReached(new Set());

    return () => {
      stopIntervals();
    };
  }, [lessonId]);

  const stopIntervals = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setHasStarted(true);
    setResumeTime(null); // Clear resume prompt once playing
    trackPlay();
    startTracking();
  };

  const handlePause = () => {
    setIsPlaying(false);
    trackPause(simulatedProgress);
    stopIntervals();
  };

  const startTracking = () => {
    stopIntervals();

    // 1. Progress Simulation Interval (UI update)
    progressIntervalRef.current = setInterval(() => {
      setSimulatedProgress(prev => {
        const next = prev + 1;
        if (next >= SIMULATED_DURATION) {
          handleComplete();
          return SIMULATED_DURATION;
        }
        return next;
      });
    }, 1000 / playbackRate);

    // 2. PostHog Tracking Interval (Every 10s)
    trackingIntervalRef.current = setInterval(() => {
      const percent = Math.round((simulatedProgress / SIMULATED_DURATION) * 100);
      trackProgress(simulatedProgress, SIMULATED_DURATION);

      // Save to local storage
      localStorage.setItem(`video-progress-${lessonId}`, simulatedProgress.toString());

      // Save to Supabase database
      if (supabaseUser) {
        updateWatchProgress(supabaseUser.id, lessonId, percent).catch(err => {
          console.error('Error saving watch progress:', err);
        });
      }
    }, 10000);
  };

  const handleComplete = () => {
    setIsPlaying(false);
    stopIntervals();
    trackComplete();
    onComplete();
    localStorage.removeItem(`video-progress-${lessonId}`);
  };

  const handleResume = () => {
    if (resumeTime) {
      setSimulatedProgress(resumeTime);
    }
    handlePlay();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  // --- PostHog Tracking Functions ---
  
  const trackPlay = () => {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('video_play', {
        lesson_id: lessonId,
        lesson_title: lessonTitle,
        timestamp: new Date().toISOString()
      });
    }
  };

  const trackProgress = (currentTime: number, duration: number) => {
    const percent = Math.round((currentTime / duration) * 100);
    
    // Milestone Tracking logic
    const milestones = [25, 50, 75, 100];
    milestones.forEach(m => {
      if (percent >= m && !milestonesReached.has(m)) {
        trackMilestone(m);
        setMilestonesReached(prev => new Set(prev).add(m));
      }
    });

    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('video_progress', {
        lesson_id: lessonId,
        lesson_title: lessonTitle,
        current_time: Math.round(currentTime),
        percent_watched: percent,
        total_duration: Math.round(duration)
      });
    }
    if (onProgress) onProgress(percent);
  };

  const trackMilestone = (milestone: number) => {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('video_milestone', {
        lesson_id: lessonId,
        lesson_title: lessonTitle,
        milestone: milestone
      });
    }
  };

  const trackPause = (currentTime: number) => {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('video_pause', {
        lesson_id: lessonId,
        paused_at: Math.round(currentTime)
      });
    }
  };

  const trackComplete = () => {
    // Ensure 100% milestone is fired if not already
    if (!milestonesReached.has(100)) {
        trackMilestone(100);
        setMilestonesReached(prev => new Set(prev).add(100));
    }

    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('video_complete', {
        lesson_id: lessonId,
        lesson_title: lessonTitle
      });
    }
  };

  // --- Render ---

  if (!videoUrl) {
    return (
      <div className="relative aspect-video bg-[#111] border border-[#333] shadow-2xl rounded-xl flex flex-col items-center justify-center overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-tr from-[#CCFF00]/5 to-transparent"></div>
         <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4 border border-[#333] relative z-10">
            <Video size={32} className="text-gray-600" />
         </div>
         <h3 className="text-white font-bold text-lg mb-1 relative z-10">سيتم إضافة الفيديو قريباً</h3>
         <p className="text-gray-500 text-sm relative z-10">جاري العمل على إنتاج هذا الدرس</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative aspect-video bg-[#0a0a0a] border border-[#333] shadow-2xl rounded-xl overflow-hidden group">
      
      {/* Video Embed */}
      {!hasStarted ? (
        // Thumbnail / Initial State
        <div className="absolute inset-0 z-10 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {resumeTime && (
                    <div className="mb-6 bg-[#1a1a1a] border border-[#CCFF00] p-4 rounded-lg flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                        <span className="text-white text-sm">لديك تقدم محفوظ ({Math.floor(resumeTime / 60)}:{String(resumeTime % 60).padStart(2, '0')})</span>
                        <button 
                            onClick={handleResume}
                            className="bg-[#CCFF00] text-black px-3 py-1 text-xs font-bold rounded flex items-center gap-1 hover:bg-white transition-colors"
                        >
                            <RotateCcw size={12} /> متابعة
                        </button>
                    </div>
                )}

                <button 
                    onClick={handlePlay}
                    className="group/btn relative"
                >
                    <div className="w-24 h-24 bg-[#CCFF00] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(204,255,0,0.3)] group-hover/btn:shadow-[0_0_60px_rgba(204,255,0,0.6)] group-hover/btn:scale-105 transition-all duration-300">
                        <Play size={40} className="ml-2 text-black fill-current" />
                    </div>
                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white font-bold tracking-wider opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
                        ابدأ المشاهدة
                    </span>
                </button>
            </div>
        </div>
      ) : (
        // Active Player
        <div className="w-full h-full relative bg-black">
            <iframe
                src={`${getEmbedUrl(videoUrl)}&autoplay=1&controls=0`}
                title={lessonTitle}
                className="w-full h-full pointer-events-auto"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
            
            {/* Custom Control Bar Overlay (Shows on Hover) */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
                {/* Progress Bar */}
                <div 
                    className="w-full h-1.5 bg-gray-600 rounded-full mb-4 cursor-pointer relative group/progress"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const pct = x / rect.width;
                        setSimulatedProgress(pct * SIMULATED_DURATION);
                    }}
                >
                    <div 
                        className="absolute left-0 top-0 bottom-0 bg-[#CCFF00] rounded-full"
                        style={{ width: `${(simulatedProgress / SIMULATED_DURATION) * 100}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                        <button onClick={isPlaying ? handlePause : handlePlay} className="hover:text-[#CCFF00] transition-colors">
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                        </button>
                        
                        <div className="flex items-center gap-2 group/vol">
                            <button onClick={() => setIsMuted(!isMuted)} className="hover:text-[#CCFF00]">
                                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={isMuted ? 0 : volume}
                                onChange={(e) => setVolume(Number(e.target.value))}
                                className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 h-1 accent-[#CCFF00]"
                            />
                        </div>

                        <span className="text-xs font-mono text-gray-300">
                            {Math.floor(simulatedProgress / 60)}:{String(Math.floor(simulatedProgress % 60)).padStart(2, '0')} / 
                            {Math.floor(SIMULATED_DURATION / 60)}:{String(Math.floor(SIMULATED_DURATION % 60)).padStart(2, '0')}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Speed Toggle */}
                        <div className="relative group/speed">
                            <button className="text-xs font-bold hover:text-[#CCFF00] flex items-center gap-1">
                                {playbackRate}x <Settings size={14} />
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1a1a] border border-[#333] rounded p-1 hidden group-hover/speed:block min-w-[60px]">
                                {[0.5, 1, 1.25, 1.5, 2].map(rate => (
                                    <button
                                        key={rate}
                                        onClick={() => setPlaybackRate(rate)}
                                        className={`block w-full text-center text-xs py-1 px-2 hover:bg-[#333] rounded ${playbackRate === rate ? 'text-[#CCFF00]' : 'text-gray-300'}`}
                                    >
                                        {rate}x
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={toggleFullscreen} className="hover:text-[#CCFF00]">
                            <Maximize size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};