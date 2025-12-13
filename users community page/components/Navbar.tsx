import React from 'react';
import { Bell, Menu, LogOut } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'community', name: 'المجتمع' },
    { id: 'classroom', name: 'الدورة' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-nav border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Area (Right) */}
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <span className="font-black text-xl tracking-tighter text-white">7-DAYAPP</span>
            </div>

            {/* Main Navigation Tabs */}
            <div className="hidden md:flex items-center space-x-1 space-x-reverse">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? 'text-lime-accent'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Right Actions (Left in RTL) */}
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-4 text-sm font-bold text-gray-400">
                <a href="#" className="hover:text-white transition-colors">الدروس المجانية</a>
                <a href="#" className="hover:text-white transition-colors">فتح الدورة</a>
             </div>

             <div className="h-6 w-px bg-gray-800 mx-1 hidden md:block"></div>

            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-nav"></span>
            </button>

            <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-gray-800 transition-colors group">
              <img 
                src="https://picsum.photos/seed/me/40/40" 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-gray-700 group-hover:border-lime-accent transition-colors"
              />
            </button>
            
             <button className="hidden md:flex p-2 text-gray-400 hover:text-white transition-colors" title="تسجيل خروج">
              <LogOut className="w-5 h-5" />
            </button>

            <button className="md:hidden p-2 text-gray-400">
                <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
