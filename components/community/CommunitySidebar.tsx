import React from 'react';
import { Users, Trophy } from 'lucide-react';
import { CommunityStats } from '../../types/community';

interface CommunitySidebarProps {
  stats: CommunityStats;
  hasAccess?: boolean;
  subscriptionStatus?: 'active' | 'trial' | 'expired' | null;
  trialDaysLeft?: number;
  onSubscribe?: () => void;
}

const CommunitySidebar: React.FC<CommunitySidebarProps> = ({ stats }) => {
  return (
    <div className="space-y-6">

      {/* Free Community Banner */}
      <div className="bg-[#CCFF00] rounded-xl p-6 text-center">
        <h2 className="text-xl font-black text-gray-900 mb-2">
          🎉 مجتمع مجاني للجميع!
        </h2>
        <p className="text-gray-700 text-sm mb-4">
          شارك تجربتك، تعلم من الآخرين، وتواصل مع مجتمع المطورين
        </p>
        <div className="bg-gray-900 text-white rounded-lg py-2 px-4 text-sm font-bold">
          100% مجاني - بدون اشتراك
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#CCFF00]" />
          <span>إحصائيات المجتمع</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">إجمالي الأعضاء</span>
            <span className="font-bold text-gray-900">{stats.total_members.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              متصل الآن
            </span>
            <span className="font-bold text-green-600">{stats.online_now.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">المشرفون</span>
            <span className="font-bold text-gray-900">{stats.admins_count}</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-gray-500 text-sm">إجمالي المنشورات</span>
            <span className="font-bold text-[#CCFF00]">{stats.total_posts.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Community Rules */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#CCFF00]" />
          <span>قواعد المجتمع</span>
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-[#CCFF00] font-bold">•</span>
            <span>كن محترماً ومهذباً مع الجميع</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#CCFF00] font-bold">•</span>
            <span>شارك خبراتك وساعد الآخرين</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#CCFF00] font-bold">•</span>
            <span>لا تنشر محتوى غير لائق</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#CCFF00] font-bold">•</span>
            <span>ابحث قبل طرح الأسئلة</span>
          </li>
        </ul>
      </div>

    </div>
  );
};

export default CommunitySidebar;
