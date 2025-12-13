import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { signUp } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

export const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation: Password length
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    // Validation: Passwords match
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);

    try {
      const { user, error: signUpError } = await signUp(email, password, name);

      if (signUpError) {
        setError(signUpError);
        setLoading(false);
        return;
      }

      if (user) {
        await refreshUser();

        // Track signup completion
        if (typeof window !== 'undefined' && (window as any).posthog) {
          (window as any).posthog.capture('signup_completed', {
            method: 'email',
            timestamp: new Date().toISOString()
          });
        }

        // After signup, redirect to course page (freemium model)
        navigate('/course');
      }
    } catch (err) {
      setError('حدث خطأ أثناء إنشاء الحساب');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20 bg-[#0a0a0a]">
      <div className="w-full max-w-md bg-[#111] p-10 border border-[#333] shadow-2xl relative">
        <div className="text-center mb-10">
          <Link to="/" className="font-display font-black text-3xl tracking-tighter text-white block mb-4">
            7-DAY<span className="text-[#CCFF00]">APP</span>
          </Link>
          <h2 className="text-xl font-bold text-white">إنشاء حساب جديد</h2>
          <p className="text-gray-500 mt-2 text-sm">ابدأ رحلتك التعليمية اليوم.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">الاسم الكامل</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] p-4 text-white focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-all"
              placeholder="الاسم الثلاثي"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] p-4 text-white focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-all text-left"
              placeholder="you@example.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] p-4 text-white focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-all text-left"
              placeholder="••••••••"
              dir="ltr"
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">يجب أن تكون 6 أحرف على الأقل</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">تأكيد كلمة المرور</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] p-4 text-white focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-all text-left"
              placeholder="••••••••"
              dir="ltr"
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-[#CCFF00] text-sm font-bold bg-[#CCFF00]/10 p-3 border border-[#CCFF00]/20 text-center">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </Button>

          <div className="text-center mt-6">
            <Link to="/login" className="text-sm text-[#CCFF00] hover:text-white font-bold underline decoration-1 underline-offset-4">
              لديك حساب؟ سجل دخول
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
