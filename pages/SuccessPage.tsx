import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, BookOpen, ArrowLeft, Sparkles, AlertCircle, XCircle } from 'lucide-react';
import { signupAndPurchase } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Confetti Component
const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    rotation: number;
    color: string;
    size: number;
    speedY: number;
    speedX: number;
    speedRotation: number;
  }>>([]);

  useEffect(() => {
    const colors = ['#CCFF00', '#00FF88', '#00CCFF', '#FF00CC', '#FFCC00', '#FF6600'];
    const newParticles = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 100,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 8,
      speedY: 2 + Math.random() * 3,
      speedX: -2 + Math.random() * 4,
      speedRotation: -3 + Math.random() * 6
    }));
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        y: p.y + p.speedY,
        x: p.x + p.speedX,
        rotation: p.rotation + p.speedRotation,
        speedY: p.speedY + 0.1
      })).filter(p => p.y < window.innerHeight + 50));
    }, 16);

    setTimeout(() => clearInterval(interval), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            borderRadius: '2px'
          }}
        />
      ))}
    </div>
  );
};

// Main Component
const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, supabaseUser, refreshUser } = useAuth();
  const [showConfetti, setShowConfetti] = useState(true);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(47);
  const [hasUpsell, setHasUpsell] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  useEffect(() => {
    const processPurchase = async () => {
      // Check for error parameters (legacy format)
      const errorParam = searchParams.get('error');
      if (errorParam === 'cancelled') {
        setError('تم إلغاء عملية الدفع');
        setShowConfetti(false);
        return;
      }
      if (errorParam === 'failed') {
        setError('فشلت عملية الدفع، يرجى المحاولة مرة أخرى');
        setShowConfetti(false);
        return;
      }

      // Check for Tap Payments status parameter
      const tapId = searchParams.get('tap_id');
      const purchaseRef = searchParams.get('ref');

      // If we have tap_id, verify directly with Tap API first
      if (tapId && purchaseRef && supabaseUser) {
        console.log('🔍 [SUCCESS PAGE] Verifying payment with Tap API:', { tap_id: tapId, purchase_id: purchaseRef });
        setIsVerifying(true);
        setVerificationMessage('جاري التحقق من الدفع مع Tap...');

        try {
          const verifyResponse = await supabase.functions.invoke('verify-tap-payment', {
            body: {
              tap_id: tapId,
              purchase_id: purchaseRef
            }
          });

          console.log('📊 [SUCCESS PAGE] Tap verification response:', verifyResponse);

          if (verifyResponse.data?.success && verifyResponse.data?.status === 'completed') {
            console.log('✅ [SUCCESS PAGE] Payment verified as completed via Tap API');
            setIsVerifying(false);

            // Fetch purchase details
            const { data: purchaseData } = await supabase
              .from('purchases')
              .select('*')
              .eq('id', purchaseRef)
              .single();

            if (purchaseData) {
              setPurchaseAmount(purchaseData.amount_kwd);
              setHasUpsell(purchaseData.has_upsell);
            }

            // Refresh user to update hasPurchased status
            console.log('🔄 [SUCCESS PAGE] Refreshing user to update hasPurchased status...');
            await refreshUser();
            console.log('✅ [SUCCESS PAGE] User refreshed, hasPurchased should now be true');

            // Track PostHog event
            if (typeof window !== 'undefined' && (window as any).posthog) {
              (window as any).posthog.capture('purchase_completed', {
                purchase_id: purchaseRef,
                tap_id: tapId,
                amount: purchaseData?.amount_kwd,
                hasUpsell: purchaseData?.has_upsell,
                currency: 'KWD'
              });
            }

            // Success - exit early
            return;
          } else if (verifyResponse.error) {
            console.error('❌ [SUCCESS PAGE] Tap verification failed:', verifyResponse.error);
            // Fall through to polling logic
          }
        } catch (err) {
          console.error('❌ [SUCCESS PAGE] Error calling verify function:', err);
          // Fall through to polling logic
        }
      }

      // Fallback: Poll database for payment status (in case webhook completed it)
      if (purchaseRef && supabaseUser) {
        try {
          let purchase: any = null;
          let pollCount = 0;
          const maxPolls = 10; // 30 seconds max (10 polls * 3 seconds)

          if (!isVerifying) {
            setIsVerifying(true);
            setVerificationMessage('جاري التحقق من الدفع...');
          }

          while (pollCount < maxPolls) {
            const { data, error: purchaseError } = await supabase
              .from('purchases')
              .select('*')
              .eq('id', purchaseRef)
              .eq('user_id', supabaseUser.id)
              .single();

            if (purchaseError || !data) {
              console.error('Purchase verification failed:', purchaseError);
              if (pollCount === maxPolls - 1) {
                setError('لم نتمكن من التحقق من عملية الشراء');
                setShowConfetti(false);
                setIsVerifying(false);
                return;
              }
            } else {
              purchase = data;

              // Check if payment is completed
              if ((purchase as any).status === 'completed') {
                console.log('✅ [SUCCESS PAGE] Payment verified as completed');
                console.log('📊 [SUCCESS PAGE] Purchase data:', {
                  id: purchase.id,
                  user_id: purchase.user_id,
                  amount: purchase.amount_kwd,
                  status: purchase.status
                });
                setIsVerifying(false);
                break;
              }

              // Check if payment failed
              if ((purchase as any).status === 'failed') {
                setError('فشلت عملية الدفع');
                setShowConfetti(false);
                setIsVerifying(false);
                return;
              }

              // Still pending, continue polling
              if (pollCount < maxPolls - 1) {
                console.log(`Payment still pending, polling again (${pollCount + 1}/${maxPolls})...`);
                setVerificationMessage(`جاري التحقق من الدفع... (${pollCount + 1}/${maxPolls})`);
                await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
              }
            }

            pollCount++;
          }

          // If still pending after max polls, show pending message
          if (purchase && (purchase as any).status === 'pending') {
            setVerificationMessage('عملية الدفع قيد المعالجة. سنرسل لك تأكيد عبر البريد الإلكتروني.');
          }

          if (!purchase) {
            setError('لم نتمكن من التحقق من عملية الشراء');
            setShowConfetti(false);
            setIsVerifying(false);
            return;
          }

          // Set purchase details
          setPurchaseAmount((purchase as any).amount_kwd);
          setHasUpsell((purchase as any).has_upsell);

          // Only refresh user if payment is completed
          if ((purchase as any).status === 'completed') {
            console.log('🔄 [SUCCESS PAGE] Refreshing user to update hasPurchased status...');
            await refreshUser();
            console.log('✅ [SUCCESS PAGE] User refreshed, hasPurchased should now be true');
          }

          // Track PostHog event
          if (typeof window !== 'undefined' && (window as any).posthog) {
            (window as any).posthog.capture('purchase_completed', {
              purchase_id: (purchase as any).id,
              amount: (purchase as any).amount_kwd,
              hasUpsell: (purchase as any).has_upsell,
              currency: 'KWD'
            });
          }
        } catch (err) {
          console.error('Error verifying purchase:', err);
          setIsVerifying(false);
        }
      }

      // Handle pending_user (for non-logged-in purchases)
      let pendingUserJson = null;
      try {
        pendingUserJson = localStorage.getItem('pending_user');
      } catch (e) {
        console.error("Error reading pending user", e);
      }

      if (pendingUserJson) {
        const userData = JSON.parse(pendingUserJson);
        setUserName(userData.name);
        setHasUpsell(userData.hasUpsell);
        setPurchaseAmount(47 + (userData.hasUpsell ? 60 : 0));

        if (!supabaseUser) {
          // Show message to set password or login
          setNeedsPassword(true);

          // Track PostHog event for pending user
          if (typeof window !== 'undefined' && (window as any).posthog) {
            (window as any).posthog.capture('purchase_completed', {
              email: userData.email,
              amount: 47 + (userData.hasUpsell ? 60 : 0),
              hasUpsell: userData.hasUpsell,
              currency: 'KWD',
              pending_signup: true
            });

            (window as any).posthog.identify(userData.email, {
              name: userData.name,
              email: userData.email,
              plan: 'course_47kwd',
              purchased_at: new Date().toISOString()
            });
          }
        } else {
          // User is logged in, create purchase directly (don't use signupAndPurchase)
          console.log('[SuccessPage] User is logged in, creating purchase for user:', supabaseUser.id);

          try {
            const { data: purchaseData, error: purchaseError } = await supabase
              .from('purchases')
              .insert({
                user_id: supabaseUser.id,
                amount_kwd: userData.hasUpsell ? 107 : 47,
                status: 'completed',
                has_upsell: userData.hasUpsell,
                upayments_ref: `manual-${Date.now()}`
              } as any)
              .select()
              .single();

            if (purchaseError) {
              console.error('[SuccessPage] Error creating purchase:', purchaseError);
            } else {
              console.log('[SuccessPage] Purchase created successfully:', purchaseData);
            }
          } catch (err) {
            console.error('[SuccessPage] Purchase creation failed:', err);
          }

          console.log('[SuccessPage] Calling refreshUser to update hasPurchased...');
          await refreshUser();
          console.log('[SuccessPage] refreshUser completed');
        }

        // Cleanup pending_user
        try {
          localStorage.removeItem('pending_user');
        } catch (e) {
          console.error("Error clearing pending user", e);
        }
      } else if (user) {
        // User is logged in, use their data
        setUserName(user.name);
        if (!user.hasPurchased && !purchaseRef) {
          // No purchase found, redirect to checkout
          navigate('/checkout');
        }
      } else if (!purchaseRef) {
        // No pending user and no purchase ref, redirect to checkout
        navigate('/checkout');
      }
    };

    processPurchase();
    setTimeout(() => setShowConfetti(false), 5000);
  }, [navigate, user, supabaseUser, refreshUser, searchParams]);

  // Verifying state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-[#CCFF00]/20 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 border-4 border-[#CCFF00] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {verificationMessage}
          </h1>

          <p className="text-gray-400 mb-8">الرجاء الانتظار بينما نتحقق من عملية الدفع...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle size={48} className="text-red-500" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            عذراً، حدث خطأ
          </h1>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3 text-red-500">
              <AlertCircle size={20} />
              <p className="font-bold">{error}</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-[#CCFF00] text-black font-bold py-4 px-8 rounded-xl hover:bg-[#b8e600] transition-all duration-300 flex items-center justify-center gap-3 text-lg mb-4"
          >
            حاول مرة أخرى
          </button>

          <button
            onClick={() => navigate('/course')}
            className="w-full bg-[#333] text-white font-bold py-4 px-8 rounded-xl hover:bg-[#444] transition-all duration-300 flex items-center justify-center gap-3 text-lg mb-4"
          >
            <BookOpen size={24} />
            العودة للدورة
          </button>

          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft size={18} />
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {showConfetti && <Confetti />}

      <div className="max-w-lg w-full text-center">
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto bg-[#CCFF00] rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle size={48} className="text-black" />
          </div>
          <Sparkles className="absolute top-0 right-1/3 text-[#CCFF00] animate-pulse" size={24} />
          <Sparkles className="absolute bottom-0 left-1/3 text-[#CCFF00] animate-pulse" size={20} />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          🎉 مبروك {userName || 'صديقنا'}!
        </h1>

        <p className="text-xl text-gray-300 mb-2">تم الاشتراك بنجاح</p>
        <p className="text-gray-400 mb-8">أنت الآن جزء من عائلة 7DayApp. استعد لبناء تطبيقك الأول!</p>

        {needsPassword && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3 text-blue-400 mb-3">
              <AlertCircle size={20} />
              <p className="font-bold">يرجى تعيين كلمة مرور لحسابك</p>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              لقد قمت بالشراء كضيف. يرجى تسجيل الدخول أو إنشاء كلمة مرور للوصول إلى الدورة.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-[#CCFF00] text-black font-bold py-3 px-6 rounded-lg hover:bg-[#b8e600] transition-colors"
            >
              تسجيل الدخول
            </button>
          </div>
        )}

        <div className="bg-[#111] border border-[#222] rounded-xl p-6 mb-8 text-right">
          <h3 className="text-lg font-bold text-white mb-4">تفاصيل طلبك</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#CCFF00] font-bold">47 د.ك</span>
            <span className="text-gray-300">دورة 7DayApp</span>
          </div>
          {hasUpsell && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#CCFF00] font-bold">60 د.ك</span>
              <span className="text-gray-300">استشارة خاصة (٣٠ دقيقة)</span>
            </div>
          )}
          <div className="border-t border-[#222] my-4"></div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-white font-bold text-xl">{purchaseAmount} د.ك</span>
            <span className="text-white font-bold">الإجمالي</span>
          </div>
          <div className="border-t border-[#222] my-4"></div>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-center justify-end gap-2">
              <span>وصول كامل للمنهج</span>
              <CheckCircle size={16} className="text-[#CCFF00]" />
            </li>
            <li className="flex items-center justify-end gap-2">
              <span>7 أيام من المحتوى المكثف</span>
              <CheckCircle size={16} className="text-[#CCFF00]" />
            </li>
            <li className="flex items-center justify-end gap-2">
              <span>وصول مدى الحياة</span>
              <CheckCircle size={16} className="text-[#CCFF00]" />
            </li>
            <li className="flex items-center justify-end gap-2">
              <span>دعم عبر المجتمع</span>
              <CheckCircle size={16} className="text-[#CCFF00]" />
            </li>
            {hasUpsell && (
              <li className="flex items-center justify-end gap-2">
                <span>استشارة خاصة فردية</span>
                <CheckCircle size={16} className="text-[#CCFF00]" />
              </li>
            )}
          </ul>
        </div>

        <button
          onClick={() => navigate('/course')}
          className="w-full bg-[#CCFF00] text-black font-bold py-4 px-8 rounded-xl hover:bg-[#b8e600] transition-all duration-300 flex items-center justify-center gap-3 text-lg mb-4"
        >
          <BookOpen size={24} />
          ابدأ الدورة الآن
        </button>

        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <ArrowLeft size={18} />
          العودة للصفحة الرئيسية
        </button>

        <p className="text-gray-500 text-sm mt-8">تم إرسال تفاصيل الوصول إلى بريدك الإلكتروني</p>
      </div>
    </div>
  );
};

export default SuccessPage;