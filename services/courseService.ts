import { supabase } from '../lib/supabase';
import { Module, Lesson } from '../types';

// Fetch all lessons from Supabase, ordered by order_index
export const getLessons = async (): Promise<Lesson[]> => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching lessons:', error);
      return [];
    }

    // Map database fields to Lesson type
    return (data || []).map((lesson: any) => ({
      id: lesson.id,
      title: lesson.title,
      duration: `${lesson.duration} دقيقة`,
      videoUrl: lesson.video_url,
      isLocked: false // Will be computed in UI based on progress
    }));
  } catch (err) {
    console.error('Error in getLessons:', err);
    return [];
  }
};

// Fetch lessons and group them by module_id
export const getModules = async (): Promise<Module[]> => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching modules:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Group lessons by module_id
    const moduleMap = new Map<string, { id: string; title: string; lessons: Lesson[] }>();

    data.forEach((lesson: any) => {
      if (!moduleMap.has(lesson.module_id)) {
        moduleMap.set(lesson.module_id, {
          id: lesson.module_id,
          title: lesson.module_title,
          lessons: []
        });
      }

      const module = moduleMap.get(lesson.module_id)!;
      module.lessons.push({
        id: lesson.id,
        title: lesson.title,
        duration: `${lesson.duration} دقيقة`,
        videoUrl: lesson.video_url,
        isLocked: false
      });
    });

    return Array.from(moduleMap.values());
  } catch (err) {
    console.error('Error in getModules:', err);
    return [];
  }
};

// Fetch user progress from database
export const getUserProgress = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('progress')
      .select('lesson_id, watch_percentage')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user progress:', error);
      return [];
    }

    // Return lesson IDs where watch_percentage >= 90 (considered completed)
    return (data || [])
      .filter((p: any) => p.watch_percentage >= 90)
      .map((p: any) => p.lesson_id);
  } catch (err) {
    console.error('Error in getUserProgress:', err);
    return [];
  }
};

// Mark a lesson as complete
export const markLessonComplete = async (userId: string, lessonId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        watch_percentage: 100,
        completed_at: new Date().toISOString()
      } as any, {
        onConflict: 'user_id,lesson_id'
      });

    if (error) {
      console.error('Error marking lesson complete:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in markLessonComplete:', err);
    return false;
  }
};

// Update watch progress for a lesson
export const updateWatchProgress = async (
  userId: string,
  lessonId: string,
  percentage: number
): Promise<boolean> => {
  try {
    const updates: any = {
      user_id: userId,
      lesson_id: lessonId,
      watch_percentage: percentage
    };

    // Only set completed_at if percentage >= 90
    if (percentage >= 90) {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('progress')
      .upsert(updates, {
        onConflict: 'user_id,lesson_id'
      });

    if (error) {
      console.error('Error updating watch progress:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in updateWatchProgress:', err);
    return false;
  }
};

// Fetch resources for a specific lesson
export const getLessonResources = async (lessonId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching lesson resources:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getLessonResources:', err);
    return [];
  }
};

// Get watch progress percentage for a specific lesson
export const getWatchPercentage = async (
  userId: string,
  lessonId: string
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('progress')
      .select('watch_percentage')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single();

    if (error) {
      // If no progress record exists, return 0
      if (error.code === 'PGRST116') {
        return 0;
      }
      console.error('Error fetching watch percentage:', error);
      return 0;
    }

    return (data as any)?.watch_percentage || 0;
  } catch (err) {
    console.error('Error in getWatchPercentage:', err);
    return 0;
  }
};

/**
 * Get user's most recent lesson from progress table
 */
export const getLastWatchedLesson = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('progress')
      .select('lesson_id, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.lesson_id;
  } catch (err) {
    console.error('Error getting last watched lesson:', err);
    return null;
  }
};
