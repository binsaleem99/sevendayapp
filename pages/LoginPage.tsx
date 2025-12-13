import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { signIn, checkHasPurchased } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError);
        setLoading(false);
        return;
      }

      if (user) {
        await refreshUser();

        // Track login completion
        if (typeof window !== 'undefined' && (window as any).posthog) {
          (window as any).posthog.capture('login_completed', {
            method: 'email',
            timestamp: new Date().toISOString()
          });
        }

        // Always navigate to course (freemium model)
        navigate('/course');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول');
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
          <h2 className="text-xl font-bold text-white">تسجيل الدخول</h2>
          <p className="text-gray-500 mt-2 text-sm">مرحباً بك مجدداً! أدخل بياناتك للمتابعة.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-400">كلمة المرور</label>
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-[#CCFF00] transition-colors"
                onClick={() => alert('سيتم إضافة هذه الميزة قريباً')}
              >
                نسيت كلمة المرور؟
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] p-4 text-white focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-all text-left"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          {error && <p className="text-[#CCFF00] text-sm font-bold bg-[#CCFF00]/10 p-3 border border-[#CCFF00]/20 text-center">{error}</p>}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل دخول'}
          </Button>

          <div className="text-center mt-4">
            <Link to="/forgot-password" className="text-sm text-gray-400 hover:text-[#CCFF00] transition-colors">
              نسيت كلمة المرور؟
            </Link>
          </div>

          <div className="text-center mt-4">
            <Link to="/signup" className="text-sm text-[#CCFF00] hover:text-white font-bold underline decoration-1 underline-offset-4">
              إنشاء حساب جديد
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};