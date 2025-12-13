import { supabase } from '../lib/supabase';

export interface DashboardStats {
  totalUsers: number;
  totalPurchases: number;
  totalRevenue: number;
  conversionRate: number;
  todaySignups: number;
  weeklyRevenue: number;
}

export interface RecentUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  hasPurchased: boolean;
}

export interface RecentPurchase {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  amount_kwd: number;
  has_upsell: boolean;
  status: string;
  created_at: string;
}

export interface UserWithPurchase {
  id: string;
  name: string;
  email: string;
  created_at: string;
  hasPurchased: boolean;
  purchaseAmount?: number;
  purchaseDate?: string;
}

/**
 * Get dashboard statistics
 */
export const getStats = async (): Promise<DashboardStats> => {
  try {
    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get completed purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('amount_kwd, created_at')
      .eq('status', 'completed');

    if (purchasesError) throw purchasesError;

    const totalPurchases = purchases?.length || 0;
    const totalRevenue = purchases?.reduce((sum, p) => sum + (p.amount_kwd || 0), 0) || 0;

    // Calculate conversion rate
    const conversionRate = totalUsers && totalUsers > 0
      ? (totalPurchases / totalUsers) * 100
      : 0;

    // Get today's signups (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { count: todaySignups, error: todayError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    if (todayError) throw todayError;

    // Get weekly revenue (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: weeklyPurchases, error: weeklyError } = await supabase
      .from('purchases')
      .select('amount_kwd')
      .eq('status', 'completed')
      .gte('created_at', weekAgo.toISOString());

    if (weeklyError) throw weeklyError;

    const weeklyRevenue = weeklyPurchases?.reduce((sum, p) => sum + (p.amount_kwd || 0), 0) || 0;

    return {
      totalUsers: totalUsers || 0,
      totalPurchases,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      conversionRate: Number(conversionRate.toFixed(1)),
      todaySignups: todaySignups || 0,
      weeklyRevenue: Number(weeklyRevenue.toFixed(2))
    };
  } catch (error) {
    console.error('[getStats] Error:', error);
    throw error;
  }
};

/**
 * Get recent users (signups)
 */
export const getRecentUsers = async (limit: number = 10): Promise<RecentUser[]> => {
  try {
    // Get recent profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (profilesError) throw profilesError;

    if (!profiles) return [];

    // Check purchase status for each user
    const usersWithPurchaseStatus = await Promise.all(
      profiles.map(async (profile) => {
        const { count, error } = await supabase
          .from('purchases')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('status', 'completed');

        if (error) {
          console.error('[getRecentUsers] Error checking purchase:', error);
        }

        return {
          ...profile,
          hasPurchased: (count || 0) > 0
        };
      })
    );

    return usersWithPurchaseStatus;
  } catch (error) {
    console.error('[getRecentUsers] Error:', error);
    throw error;
  }
};

/**
 * Get recent purchases with user info
 */
export const getRecentPurchases = async (limit: number = 10): Promise<RecentPurchase[]> => {
  try {
    // Get purchases with user info
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select(`
        id,
        user_id,
        amount_kwd,
        has_upsell,
        status,
        created_at,
        profiles (
          name,
          email
        )
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!purchases) return [];

    // Format the data
    return purchases.map((purchase: any) => ({
      id: purchase.id,
      user_id: purchase.user_id,
      user_name: purchase.profiles?.name || 'غير معروف',
      user_email: purchase.profiles?.email || '',
      amount_kwd: purchase.amount_kwd,
      has_upsell: purchase.has_upsell,
      status: purchase.status,
      created_at: purchase.created_at
    }));
  } catch (error) {
    console.error('[getRecentPurchases] Error:', error);
    throw error;
  }
};

/**
 * Get all users with their purchase status
 */
export const getUsersList = async (): Promise<UserWithPurchase[]> => {
  try {
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    if (!profiles) return [];

    // Get purchase info for each user
    const usersWithPurchases = await Promise.all(
      profiles.map(async (profile) => {
        const { data: purchases, error } = await supabase
          .from('purchases')
          .select('amount_kwd, created_at')
          .eq('user_id', profile.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('[getUsersList] Error getting purchases:', error);
        }

        const purchase = purchases && purchases.length > 0 ? purchases[0] : null;

        return {
          ...profile,
          hasPurchased: !!purchase,
          purchaseAmount: purchase?.amount_kwd,
          purchaseDate: purchase?.created_at
        };
      })
    );

    return usersWithPurchases;
  } catch (error) {
    console.error('[getUsersList] Error:', error);
    throw error;
  }
};

/**
 * Format date to Arabic
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `منذ ${diffMins} دقيقة`;
  } else if (diffHours < 24) {
    return `منذ ${diffHours} ساعة`;
  } else if (diffDays < 7) {
    return `منذ ${diffDays} يوم`;
  } else {
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

export interface DailySignups {
  date: string;
  count: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
}

export interface LessonAnalytics {
  lesson_id: string;
  total_views: number;
  completion_rate: number;
  avg_watch_percentage: number;
}

/**
 * Get signups over last 7 days
 */
export const getSignupsLast7Days = async (): Promise<DailySignups[]> => {
  try {
    const days: DailySignups[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDay.toISOString());

      if (error) throw error;

      days.push({
        date: date.toLocaleDateString('ar-SA', { weekday: 'short' }),
        count: count || 0
      });
    }

    return days;
  } catch (error) {
    console.error('[getSignupsLast7Days] Error:', error);
    throw error;
  }
};

/**
 * Get revenue over last 7 days
 */
export const getRevenueLast7Days = async (): Promise<DailyRevenue[]> => {
  try {
    const days: DailyRevenue[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const { data, error } = await supabase
        .from('purchases')
        .select('amount_kwd')
        .eq('status', 'completed')
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDay.toISOString());

      if (error) throw error;

      const revenue = data?.reduce((sum, p) => sum + (p.amount_kwd || 0), 0) || 0;

      days.push({
        date: date.toLocaleDateString('ar-SA', { weekday: 'short' }),
        revenue: Number(revenue.toFixed(2))
      });
    }

    return days;
  } catch (error) {
    console.error('[getRevenueLast7Days] Error:', error);
    throw error;
  }
};

/**
 * Get yesterday's stats for comparison
 */
export const getYesterdayStats = async (): Promise<{ signups: number; revenue: number }> => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Yesterday's signups
    const { count: yesterdaySignups, error: signupsError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    if (signupsError) throw signupsError;

    // Yesterday's revenue
    const { data: yesterdayPurchases, error: revenueError } = await supabase
      .from('purchases')
      .select('amount_kwd')
      .eq('status', 'completed')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    if (revenueError) throw revenueError;

    const yesterdayRevenue = yesterdayPurchases?.reduce((sum, p) => sum + (p.amount_kwd || 0), 0) || 0;

    return {
      signups: yesterdaySignups || 0,
      revenue: Number(yesterdayRevenue.toFixed(2))
    };
  } catch (error) {
    console.error('[getYesterdayStats] Error:', error);
    throw error;
  }
};

/**
 * Get lesson analytics
 */
export const getLessonAnalytics = async (): Promise<LessonAnalytics[]> => {
  try {
    // Get all lesson progress data
    const { data: progressData, error } = await supabase
      .from('progress')
      .select('lesson_id, watch_percentage');

    if (error) throw error;

    if (!progressData || progressData.length === 0) {
      return [];
    }

    // Group by lesson_id and calculate stats
    const lessonMap = new Map<string, { views: number; totalWatch: number }>();

    progressData.forEach((record: any) => {
      const lessonId = record.lesson_id;
      const existing = lessonMap.get(lessonId) || { views: 0, totalWatch: 0 };

      lessonMap.set(lessonId, {
        views: existing.views + 1,
        totalWatch: existing.totalWatch + (record.watch_percentage || 0)
      });
    });

    // Calculate analytics for each lesson
    const analytics: LessonAnalytics[] = [];

    lessonMap.forEach((stats, lessonId) => {
      const avgWatch = stats.views > 0 ? stats.totalWatch / stats.views : 0;
      const completionRate = stats.views > 0
        ? (progressData.filter((p: any) => p.lesson_id === lessonId && p.watch_percentage >= 90).length / stats.views) * 100
        : 0;

      analytics.push({
        lesson_id: lessonId,
        total_views: stats.views,
        completion_rate: Number(completionRate.toFixed(1)),
        avg_watch_percentage: Number(avgWatch.toFixed(1))
      });
    });

    return analytics.sort((a, b) => b.total_views - a.total_views);
  } catch (error) {
    console.error('[getLessonAnalytics] Error:', error);
    throw error;
  }
};
