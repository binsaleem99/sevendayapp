import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  getCurrentUser as getSupabaseUser,
  buildUserObject,
  onAuthStateChange,
  getProfile,
  signOut as authSignOut
} from '../services/authService';

interface Profile {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      console.log('[AuthContext] refreshUser called');
      const currentUser = await getSupabaseUser();
      setSupabaseUser(currentUser);

      if (currentUser) {
        console.log('[AuthContext] Current user found:', currentUser.id);
        // Fetch both user object and profile
        const [userObj, profileData] = await Promise.all([
          buildUserObject(currentUser),
          getProfile(currentUser.id)
        ]);

        console.log('[AuthContext] Setting user state with hasPurchased:', userObj?.hasPurchased);
        setUser(userObj);
        setProfile(profileData);
      } else {
        console.log('[AuthContext] No current user');
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('[AuthContext] Error refreshing user:', error);
      setUser(null);
      setSupabaseUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authSignOut();
      setUser(null);
      setSupabaseUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    // Initial load
    refreshUser();

    // Subscribe to auth state changes
    const subscription = onAuthStateChange(async (authUser) => {
      setSupabaseUser(authUser);

      if (authUser) {
        const [userObj, profileData] = await Promise.all([
          buildUserObject(authUser),
          getProfile(authUser.id)
        ]);
        setUser(userObj);
        setProfile(profileData);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    // Listen to storage events for progress updates
    const handleStorageChange = () => {
      refreshUser();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, supabaseUser, profile, loading, refreshUser, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
