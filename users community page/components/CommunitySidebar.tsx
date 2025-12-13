import React from 'react';
import { CommunityStats } from '../types';
import { Users, Radio, Crown } from 'lucide-react';

interface SidebarProps {
  stats: CommunityStats;
}

const CommunitySidebar: React.FC<SidebarProps> = ({ stats }) => {
  return (
    <div className="space-y-6">
      
      {/* Community Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-24 bg-nav relative">
            <div className="absolute -bottom-8 right-6">
                 <div className="w-16 h-16 bg-lime-accent rounded-xl flex items-center justify-center text-3xl font-black text-gray-900 border-4 border-white shadow-sm">
                    D
                </div>
            </div>
        </div>
        
        <div className="pt-10 px-6 pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">مجتمع داي آب</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            المكان الأفضل لتعلم البرمجة وبناء التطبيقات. شارك رحلتك، تعلم من الآخرين، وابنِ مستقبلك.
          </p>
          
          <div className="flex items-center gap-2 mb-6">
             <span className="w-2 h-2 bg-gray-900 rounded-full"></span>
             <span className="text-xs font-bold text-gray-700">مجموعة خاصة</span>
          </div>
        
          <div className="space-y-3 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Users className="w-4 h-4" />
                <span>الأعضاء</span>
              </div>
              <span className="font-bold text-gray-900">{stats.total_members.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Radio className="w-4 h-4 text-green-500" />
                <span>متصل الآن</span>
              </div>
              <span className="font-bold text-green-600">{stats.online_now}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span>المشرفون</span>
              </div>
              <span className="font-bold text-gray-900">{stats.admins_count}</span>
            </div>
          </div>

          <button className="w-full bg-lime-accent hover:bg-lime-hover text-gray-900 font-bold py-3 rounded-lg text-sm transition-all shadow-sm mt-2 border border-transparent">
            اشترك الآن - 9 د.ك/شهر
          </button>
        </div>
      </div>
      
      {/* Footer Links */}
      <div className="text-[11px] text-gray-400 flex flex-wrap gap-x-3 gap-y-2 justify-center px-4">
         <a href="#" className="hover:text-gray-600">الشروط والأحكام</a>
         <span>•</span>
         <a href="#" className="hover:text-gray-600">الخصوصية</a>
         <span>•</span>
         <a href="#" className="hover:text-gray-600">اتصل بنا</a>
         <span>•</span>
         <span>© 2024 DayApp</span>
      </div>

    </div>
  );
};

export default CommunitySidebar;
