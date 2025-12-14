import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { COURSE_PRICE_KWD, UPSELL_PRICE_KWD } from '../constants';
import { CheckCircle2, ShieldCheck, ArrowRight, Star, AlertCircle } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, supabaseUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [addUpsell, setAddUpsell] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState('');

  // Redirect to signup if not logged in (freemium model)
  useEffect(() => {
    if (!supabaseUser) {
      navigate('/signup');
    }
  }, [supabaseUser, navigate]);

  // Check if user already has a completed purchase
  useEffect(() => {
    const checkExistingPurchase = async () => {
      if (supabaseUser) {
        const { data, error } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', supabaseUser.id)
          .eq('status', 'completed')
          .limit(1);

        if (!error && data && data.length > 0) {
          // User already purchased, redirect to course
          navigate('/course');
        }
      }
    };

    checkExistingPurchase();
  }, [supabaseUser, navigate]);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || ''
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const applyCoupon = () => {
    setCouponError('');
    if (couponCode.toUpperCase() === 'TEST99') {
      setDiscountPercent(99); // 99% off for testing (47 becomes ~0.5)
      setCouponApplied(true);
    } else if (couponCode.toUpperCase() === 'SAVE50') {
      setDiscountPercent(50); // 50% off
      setCouponApplied(true);
    } else {
      setCouponError('كود غير صالح');
      setCouponApplied(false);
      setDiscountPercent(0);
    }
  };

  const basePrice = COURSE_PRICE_KWD + (addUpsell ? UPSELL_PRICE_KWD : 0);
  const discountAmount = couponApplied ? (basePrice * discountPercent / 100) : 0;
  const totalPrice = Math.max(0.5, basePrice - discountAmount); // minimum 0.5 KWD

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    // Validation: Check name length
    if (trimmedName.length < 2) {
      setError('الرجاء إدخال اسم صحيح (حرفين على الأقل)');
      return;
    }

    setIsProcessing(true);

    try {
      // Calculate total price with discount applied
      const totalAmount = totalPrice;

      if (!supabaseUser) {
        setError('يرجى تسجيل الدخول أولاً');
        setIsProcessing(false);
        return;
      }

      // Call Supabase Edge Function to create payment
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify({
            userId: supabaseUser.id,
            email: trimmedEmail,
            name: trimmedName,
            amount: totalAmount,
            hasUpsell: addUpsell
          })
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'فشل في إنشاء جلسة الدفع');
      }

      // Store user data for success page (in case user comes back before webhook)
      localStorage.setItem('pending_user', JSON.stringify({
        name: trimmedName,
        email: trimmedEmail,
        hasUpsell: addUpsell
      }));

      // Redirect to Upayments payment gateway
      console.log('Redirecting to payment URL:', result.paymentUrl);
      window.location.href = result.paymentUrl;

    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
        
        {/* Right Column: Form */}
        <div>
          <h1 className="text-3xl font-display font-black text-white mb-8">
            فتح جميع <span className="text-[#CCFF00]">الدروس</span>
          </h1>
          <p className="text-gray-400 mb-6">احصل على وصول كامل لـ <strong className="text-white">13 درساً</strong> + وصول مدى الحياة</p>
          
          <form onSubmit={handleSubmit} className="bg-[#111] p-8 border border-[#333]">
              <div className="space-y-6">
                 
                 <div className="grid gap-6">
                    <div>
                      <label htmlFor="checkout-name" className="block text-xs font-bold text-gray-400 mb-2 uppercase">الاسم الكامل</label>
                      <input 
                        id="checkout-name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-[#1a1a1a] border border-[#333] p-4 text-white focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-all"
                        placeholder="الاسم الثلاثي"
                        disabled={isProcessing}
                      />
                    </div>
                    <div>
                      <label htmlFor="checkout-email" className="block text-xs font-bold text-gray-400 mb-2 uppercase">البريد الإلكتروني</label>
                      <input
                        id="checkout-email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-[#1a1a1a] border border-[#333] p-4 text-white focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-all text-left"
                        placeholder="name@example.com"
                        dir="ltr"
                        disabled={isProcessing}
                      />
                    </div>

                    {/* Coupon Code Field */}
                    <div className="space-y-2">
                      <label className="block text-sm text-gray-400">كود الخصم (اختياري)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="أدخل كود الخصم"
                          className="flex-1 bg-black border border-[#333] text-white px-4 py-3 focus:border-[#CCFF00] focus:outline-none"
                          disabled={couponApplied}
                        />
                        <button
                          type="button"
                          onClick={applyCoupon}
                          disabled={couponApplied || !couponCode}
                          className="px-4 py-3 bg-[#333] text-white hover:bg-[#444] disabled:opacity-50"
                        >
                          {couponApplied ? '✅' : 'تطبيق'}
                        </button>
                      </div>
                      {couponError && <p className="text-red-500 text-sm">{couponError}</p>}
                      {couponApplied && <p className="text-green-500 text-sm">تم تطبيق خصم {discountPercent}% ✅</p>}
                    </div>
                 </div>

                 {/* Error Message */}
                 {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3 text-red-500">
                        <AlertCircle size={20} />
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                 )}

                 {/* Upsell Section */}
                 <div className="mt-8 border border-[#CCFF00]/30 bg-[#CCFF00]/5 p-6 relative overflow-hidden">
                    <div className="flex items-start gap-4">
                        <input
                            type="checkbox"
                            id="upsell"
                            checked={addUpsell}
                            onChange={() => setAddUpsell(!addUpsell)}
                            disabled={isProcessing}
                            className="w-5 h-5 accent-[#CCFF00] cursor-pointer mt-1"
                        />
                        <div className="flex-1">
                            <label htmlFor="upsell" className={`cursor-pointer ${isProcessing ? 'pointer-events-none' : ''}`}>
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-lg font-bold text-white">استشارة خاصة (٣٠ دقيقة)</h4>
                                  <span className="bg-[#CCFF00] text-black text-xs font-bold px-2 py-1">عرض خاص</span>
                                </div>
                                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                                    احصل على استشارة فردية معي لمراجعة فكرة تطبيقك.
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-[#CCFF00]">+ {UPSELL_PRICE_KWD} د.ك</span>
                                    <span className="text-sm text-gray-600 line-through">١٥٠ د.ك</span>
                                </div>
                            </label>
                        </div>
                    </div>
                    {addUpsell && (
                      <div className="mt-4 pt-4 border-t border-[#CCFF00]/20">
                        <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                          <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-blue-300 leading-relaxed">
                            سيتم التواصل معك خلال 24 ساعة لتحديد موعد الاستشارة المناسب لك.
                          </p>
                        </div>
                      </div>
                    )}
                 </div>

                 <div className="pt-6 border-t border-[#333]">
                    <div className={`flex justify-between items-center text-sm ${couponApplied ? 'text-gray-600 line-through' : 'text-gray-400'} mb-2`}>
                        <span>قيمة الدورة</span>
                        <span className="font-mono font-bold">{COURSE_PRICE_KWD} د.ك</span>
                    </div>
                    {addUpsell && (
                        <div className={`flex justify-between items-center text-sm ${couponApplied ? 'text-gray-600 line-through' : 'text-[#CCFF00]'} mb-2 font-bold`}>
                            <span>استشارة خاصة</span>
                            <span className="font-mono">{UPSELL_PRICE_KWD} د.ك</span>
                        </div>
                    )}
                    {couponApplied && discountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm text-[#CCFF00] mb-2 font-bold">
                            <span>الخصم ({discountPercent}%)</span>
                            <span className="font-mono">-{discountAmount.toFixed(2)} د.ك</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-xl font-bold text-white mt-4 bg-[#1a1a1a] p-4 border border-[#333]">
                        <span>الإجمالي</span>
                        <span className="font-mono">{totalPrice.toFixed(2)} د.ك</span>
                    </div>
                 </div>

                 <Button
                    type="submit"
                    fullWidth
                    disabled={isProcessing}
                    className="shadow-none hover:shadow-[0_0_20px_rgba(204,255,0,0.3)] mt-4"
                 >
                    {isProcessing ? (
                        <span className="flex items-center gap-2">
                             جاري تحويلك لبوابة الدفع...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            ادفع الآن - {totalPrice.toFixed(2)} د.ك <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                        </span>
                    )}
                 </Button>
              </div>
          </form>
          
          <div className="flex justify-center items-center gap-2 mt-6 text-gray-500 text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>سيتم تحويلك إلى بوابة دفع آمنة (K-NET, Visa, MasterCard)</span>
          </div>
        </div>

        {/* Left Column: Summary */}
        <div className="hidden lg:block">
            <div className="sticky top-32">
                <div className="bg-[#111] p-8 border border-[#333] mb-6">
                    <h3 className="font-display font-bold text-xl mb-6 text-white">ملخص الطلب</h3>
                    <div className="flex gap-4 mb-8">
                        <div className="w-20 h-20 bg-[#222] bg-[url('https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&q=80')] bg-cover shrink-0 grayscale hover:grayscale-0 transition-all"></div>
                        <div>
                            <h4 className="font-bold text-white text-lg leading-tight mb-1">تطبيق الـ ٧ أيام</h4>
                            <p className="text-sm text-[#CCFF00]">دورة تدريبية مكثفة</p>
                            <div className="flex items-center gap-1 mt-2 text-[#CCFF00]">
                                <Star className="w-3 h-3 fill-current" />
                                <Star className="w-3 h-3 fill-current" />
                                <Star className="w-3 h-3 fill-current" />
                                <Star className="w-3 h-3 fill-current" />
                                <Star className="w-3 h-3 fill-current" />
                            </div>
                        </div>
                    </div>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-sm text-gray-400">
                            <CheckCircle2 className="w-5 h-5 text-[#CCFF00]" />
                            <span>وصول فوري لجميع الدروس (مدى الحياة)</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gray-400">
                            <CheckCircle2 className="w-5 h-5 text-[#CCFF00]" />
                            <span>قوالب جاهزة للنسخ واللصق</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gray-400">
                            <CheckCircle2 className="w-5 h-5 text-[#CCFF00]" />
                            <span>دعم مجتمعي ونقاشات مفتوحة</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gray-400">
                            <CheckCircle2 className="w-5 h-5 text-[#CCFF00]" />
                            <span>ضمان استرداد الأموال خلال 14 يوم</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};