import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const CommunitySuccessPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to community page after 3 seconds
    const timer = setTimeout(() => {
      navigate('/community');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-32 px-6">
      <div className="max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <CheckCircle className="text-green-500" size={48} />
        </div>

        <h1 className="text-3xl font-bold mb-4">تم تفعيل اشتراكك! 🎉</h1>

        <p className="text-gray-400 mb-8 text-lg">
          مرحباً بك في مجتمع 7DayApp. سيتم تحويلك إلى صفحة المجتمع...
        </p>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6 text-right">
          <h3 className="font-bold text-[#CCFF00] mb-3">ماذا الآن؟</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-[#CCFF00]">•</span>
              <span>شارك تجربتك في بناء التطبيقات</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#CCFF00]">•</span>
              <span>اطرح أسئلتك واحصل على إجابات من الأعضاء</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#CCFF00]">•</span>
              <span>استفد من خبرات المطورين الآخرين</span>
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <button
            onClick={() => navigate('/community')}
            className="bg-[#CCFF00] text-black px-8 py-3 rounded-lg font-bold hover:bg-[#b8e600] transition-colors"
          >
            انتقل إلى المجتمع الآن
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunitySuccessPage;
