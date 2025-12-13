import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted' && typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('pwa_installed');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-[#111] border border-[#333] rounded-xl p-4 shadow-2xl z-50">
      <button onClick={handleDismiss} className="absolute top-2 left-2 text-gray-500 hover:text-white">
        <X size={20} />
      </button>
      
      <div className="flex items-start gap-3 pr-2">
        <div className="w-12 h-12 bg-[#CCFF00] rounded-xl flex items-center justify-center flex-shrink-0">
          <Download size={24} className="text-black" />
        </div>
        <div className="flex-1 text-right">
          <h4 className="font-bold text-white mb-1">ثبّت التطبيق</h4>
          <p className="text-gray-400 text-sm mb-3">أضف 7DayApp لشاشتك الرئيسية للوصول السريع</p>
          <button
            onClick={handleInstall}
            className="w-full bg-[#CCFF00] text-black font-bold py-2 px-4 rounded-lg hover:bg-[#b8e600] transition-colors text-sm"
          >
            تثبيت الآن
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;