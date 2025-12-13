import { supabase } from '../lib/supabase';
import { User } from '../types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Helper for safe storage access (for non-auth data like video progress)
const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error(`Error getting item ${key}:`, e);
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error(`Error setting item ${key}:`, e);
  }
};

const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error(`Error removing item ${key}:`, e);
  }
};

// Arabic error messages
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  EMAIL_EXISTS: 'هذا البريد مسجل مسبقاً',
  PASSWORD_TOO_SHORT: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
  NETWORK_ERROR: 'خطأ في الاتصال. يرجى المحاولة مرة أخرى',
  UNKNOWN_ERROR: 'حدث خطأ غير متوقع'
};

// Helper to translate Supabase errors to Arabic
const translateError = (error: any): string => {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR;

  const message = error.message?.toLowerCase() || '';

  if (message.includes('invalid login credentials') || message.includes('invalid password')) {
    return ERROR_MESSAGES.INVALID_CREDENTIALS;
  }
  if (message.includes('user already registered') || message.includes('email already exists')) {
    return ERROR_MESSAGES.EMAIL_EXISTS;
  }
  if (message.includes('password') && message.includes('6')) {
    return ERROR_MESSAGES.PASSWORD_TOO_SHORT;
  }
  if (message.includes('network') || message.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

// Sign up new user
export const signUp = async (
  email: string,
  password: string,
  name: string
): Promise<{ user: SupabaseUser | null; error: string | null }> => {
  try {
    // Validate password length
    if (password.length < 6) {
      return { user: null, error: ERROR_MESSAGES.PASSWORD_TOO_SHORT };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          name: name.trim()
        }
      }
    });

    if (error) {
      return { user: null, error: translateError(error) };
    }

    // Create profile in profiles table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          is_admin: false
        } as any);

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }

    return { user: data.user, error: null };
  } catch (err) {
    console.error('Sign up error:', err);
    return { user: null, error: translateError(err) };
  }
};

// Sign in existing user
export const signIn = async (
  email: string,
  password: string
): Promise<{ user: SupabaseUser | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    });

    if (error) {
      return { user: null, error: translateError(error) };
    }

    return { user: data.user, error: null };
  } catch (err) {
    console.error('Sign in error:', err);
    return { user: null, error: translateError(err) };
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();

    // Clear video progress keys
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('video-progress-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('Error clearing video progress', e);
    }

    window.location.href = '/';
  } catch (error) {
    console.error('Sign out error:', error);
    window.location.href = '/';
  }
};

// Get current user
export const getCurrentUser = async (): Promise<SupabaseUser | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return user;
  } catch (err) {
    console.error('Get current user error:', err);
    return null;
  }
};

// Get user profile from profiles table
export const getProfile = async (userId: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error getting profile:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Get profile error:', err);
    return null;
  }
};

// Check if user has purchased
export const checkHasPurchased = async (userId: string): Promise<boolean> => {
  try {
    console.log('[checkHasPurchased] Checking purchases for user:', userId);
    const { data, error } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .limit(1);

    if (error) {
      console.error('[checkHasPurchased] Error checking purchases:', error);
      return false;
    }

    const hasPurchased = data && data.length > 0;
    console.log('[checkHasPurchased] Result:', hasPurchased, 'Data:', data);
    return hasPurchased;
  } catch (err) {
    console.error('[checkHasPurchased] Check purchase error:', err);
    return false;
  }
};

// Check if user has upsell (60 KWD meeting)
export const checkHasUpsell = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('has_upsell')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .eq('has_upsell', true)
      .limit(1);

    if (error) {
      console.error('Error checking upsell:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (err) {
    console.error('Check upsell error:', err);
    return false;
  }
};

// Get completed lessons for a user
export const getCompletedLessons = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .gte('watch_percentage', 90); // Consider completed if watched 90%+

    if (error) {
      console.error('Error getting completed lessons:', error);
      return [];
    }

    return data ? data.map((item: any) => item.lesson_id) : [];
  } catch (err) {
    console.error('Get completed lessons error:', err);
    return [];
  }
};

// Build User object from Supabase data
export const buildUserObject = async (supabaseUser: SupabaseUser): Promise<User | null> => {
  try {
    console.log('[buildUserObject] Building user object for:', supabaseUser.id);
    const [profile, hasPurchased, hasUpsell, completedLessons] = await Promise.all([
      getProfile(supabaseUser.id),
      checkHasPurchased(supabaseUser.id),
      checkHasUpsell(supabaseUser.id),
      getCompletedLessons(supabaseUser.id)
    ]);

    if (!profile) {
      console.error('[buildUserObject] No profile found for user:', supabaseUser.id);
      return null;
    }

    const userObject = {
      name: profile.name || supabaseUser.user_metadata?.name || '',
      email: profile.email || supabaseUser.email || '',
      hasPurchased,
      hasUpsell,
      completedLessons
    };

    console.log('[buildUserObject] Built user object:', userObject);
    return userObject;
  } catch (err) {
    console.error('[buildUserObject] Error building user object:', err);
    return null;
  }
};

// Update progress for a lesson
export const updateProgress = async (lessonId: string, watchPercentage: number = 100): Promise<void> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('No user logged in');
      return;
    }

    const { error } = await supabase
      .from('progress')
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        watch_percentage: watchPercentage,
        completed_at: watchPercentage >= 90 ? new Date().toISOString() : ''
      } as any, {
        onConflict: 'user_id,lesson_id'
      });

    if (error) {
      console.error('Error updating progress:', error);
    }

    // Trigger storage event for reactivity
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Update progress error:', err);
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: SupabaseUser | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });

  return subscription;
};

// Legacy function for backward compatibility - now returns logout
export const logout = signOut;

// Legacy synchronous login function - for backward compatibility
// Note: This is kept for compatibility but returns a promise
export const login = async (email: string, password?: string): Promise<any> => {
  if (!password) {
    // Old behavior: just check if user exists
    const user = await getCurrentUser();
    if (user && user.email?.toLowerCase() === email.toLowerCase().trim()) {
      return user;
    }
    throw new Error('User not found');
  }

  // New behavior: actually sign in with password
  const { user, error } = await signIn(email, password);
  if (error) {
    throw new Error(error);
  }
  return user;
};

// Legacy signupAndPurchase function - creates user and purchase record
export const signupAndPurchase = async (
  name: string,
  email: string,
  hasUpsell: boolean,
  password: string = 'temporary123' // Temporary password for legacy support
): Promise<void> => {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // Try to sign in first (user might already exist)
    let userId: string | null = null;
    const { user: existingUser } = await signIn(cleanEmail, password);

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Sign up new user
      const { user: newUser, error } = await signUp(cleanEmail, password, cleanName);
      if (error || !newUser) {
        // If signup fails, try to get existing user
        const currentUser = await getCurrentUser();
        if (currentUser) {
          userId = currentUser.id;
        } else {
          console.error('Failed to create user:', error);
          return;
        }
      } else {
        userId = newUser.id;
      }
    }

    if (!userId) {
      console.error('No user ID available');
      return;
    }

    // Create purchase record
    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        amount_kwd: hasUpsell ? 107 : 47, // 47 KWD base + 60 KWD upsell
        status: 'completed',
        has_upsell: hasUpsell,
        upayments_ref: `manual-${Date.now()}`
      } as any);

    if (purchaseError) {
      console.error('Error creating purchase:', purchaseError);
    }
  } catch (err) {
    console.error('signupAndPurchase error:', err);
  }
};

// Export safe storage helpers for video progress
export { safeGetItem, safeSetItem, safeRemoveItem };
