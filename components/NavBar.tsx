import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from 'lucide-react';

export const NavBar: React.FC = () => {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const isCoursePage = location.pathname.includes('/course');

  return (
    <nav className="fixed top-0 w-full z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#333]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="font-display font-black text-2xl tracking-tighter text-white">
          7-DAY<span className="text-[#CCFF00]">APP</span>
        </Link>

        <div className="flex items-center gap-6">
          {loading ? (
            <Loader className="w-4 h-4 text-gray-400 animate-spin" />
          ) : user ? (
            <>
              {profile && (
                <span className="text-sm text-gray-400 hidden sm:block">
                  مرحباً، {profile.name}
                </span>
              )}
              {/* Logged in WITHOUT purchase - show free lessons + community */}
              {!user.hasPurchased ? (
                <>
                  <Link to="/course" className="text-sm text-gray-400 hover:text-white transition-colors">
                    الدورة
                  </Link>
                  <Link to="/community" className="text-sm text-gray-400 hover:text-[#CCFF00] transition-colors relative">
                    المجتمع
                    <span className="absolute -top-1 -left-10 text-[10px] bg-[#CCFF00]/20 text-[#CCFF00] px-1.5 py-0.5 rounded font-medium">
                      قريباً
                    </span>
                  </Link>
                  <button onClick={signOut} className="text-sm text-gray-400 hover:text-white transition-colors">
                    تسجيل خروج
                  </button>
                </>
              ) : (
                /* Logged in WITH purchase - show course link if not on course page */
                <>
                  {!isCoursePage && (
                    <Link to="/course" className="text-sm font-bold text-white hover:text-[#CCFF00] transition-colors">
                      الدورة
                    </Link>
                  )}
                  <Link to="/community" className="text-sm text-gray-400 hover:text-[#CCFF00] transition-colors relative">
                    المجتمع
                    <span className="absolute -top-1 -left-10 text-[10px] bg-[#CCFF00]/20 text-[#CCFF00] px-1.5 py-0.5 rounded font-medium">
                      قريباً
                    </span>
                  </Link>
                  <button onClick={signOut} className="text-sm text-gray-400 hover:text-white transition-colors">
                    تسجيل خروج
                  </button>
                </>
              )}
            </>
          ) : (
            /* Logged out - show appropriate navigation based on current page */
            <div className="flex items-center gap-4">
              {location.pathname === '/login' ? (
                <Link to="/signup" className="text-sm font-bold text-[#CCFF00] hover:text-white transition-colors">
                  إنشاء حساب
                </Link>
              ) : location.pathname === '/signup' ? (
                <Link to="/login" className="text-sm font-bold text-white hover:text-[#CCFF00] transition-colors">
                  تسجيل دخول
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                    تسجيل دخول
                  </Link>
                  <Link to="/signup" className="text-sm font-bold text-[#CCFF00] hover:text-white transition-colors">
                    ابدأ الآن
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};