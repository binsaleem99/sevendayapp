import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, CreditCard, Shield, Users, MessageCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const CommunitySubscribePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, supabaseUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    if (!supabaseUser) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call Edge Function to create recurring subscription with Tap
      const { data: sessionData } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-community-subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session?.access_token}`
          },
          body: JSON.stringify({
            user_id: supabaseUser.id,
            email: supabaseUser.email,
            name: profile?.full_name || 'مستخدم',
            amount: 9,
            currency: 'KWD',
            redirect_url: `${window.location.origin}/#/community-success`
          })
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Redirect to Tap payment page
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        throw new Error('لم يتم الحصول على رابط الدفع');
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'حدث خطأ أثناء الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: MessageCircle, text: 'الوصول لجميع المنشورات والتعليقات' },
    { icon: Users, text: 'التواصل مع مجتمع المطورين' },
    { icon: Sparkles, text: 'نشر مشاريعك وأسئلتك' },
    { icon: Shield, text: 'دعم مباشر من الفريق' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4 pt-24">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#CCFF00]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown size={40} className="text-[#CCFF00]" />
          </div>
          <h1 className="text-3xl font-bold mb-2">عضوية المجتمع</h1>
          <p className="text-gray-400">انضم لمجتمع المطورين وتواصل مع الآخرين</p>
        </div>

        {/* Pricing Card */}
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#111] border border-[#CCFF00]/30 rounded-2xl p-6 mb-6">
          <div className="flex items-baseline justify-center gap-2 mb-6">
            <span className="text-5xl font-bold">9</span>
            <span className="text-2xl text-gray-400">د.ك</span>
            <span className="text-gray-500">/شهرياً</span>
          </div>

          {/* Benefits */}
          <div className="space-y-4 mb-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#CCFF00]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={16} className="text-[#CCFF00]" />
                </div>
                <span className="text-gray-300">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Course purchasers trial notice */}
          {user?.hasPurchased && !profile?.community_trial_used && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
              <p className="text-green-400 text-sm text-center">
                🎉 كعميل دورة، تحصل على أسبوع مجاني!
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-[#CCFF00] hover:bg-[#b8e600] disabled:opacity-50 disabled:cursor-not-allowed text-black py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                <span>جاري التحويل...</span>
              </>
            ) : (
              <>
                <CreditCard size={20} />
                <span>اشترك الآن</span>
              </>
            )}
          </button>

          {/* Payment info */}
          <div className="mt-4 flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Shield size={14} />
            <span>دفع آمن عبر Tap - VISA فقط</span>
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate('/community')}
          className="w-full text-gray-400 hover:text-white transition"
        >
          العودة للمجتمع
        </button>
      </div>
    </div>
  );
};

export default CommunitySubscribePage;
