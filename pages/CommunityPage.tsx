import React, { useEffect } from 'react';
import { Lock } from 'lucide-react';

const CommunityPage: React.FC = () => {
  useEffect(() => {
    // Create confetti effect
    const createConfetti = () => {
      const confettiContainer = document.getElementById('confetti-container');
      if (!confettiContainer) return;

      const colors = ['#D4FF00', '#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181'];
      const confettiCount = 100;

      for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confettiContainer.appendChild(confetti);
      }
    };

    createConfetti();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 relative overflow-hidden">
      {/* Confetti Container */}
      <div id="confetti-container" className="fixed inset-0 pointer-events-none z-50"></div>

      <style>{`
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          animation: fall linear infinite;
          opacity: 0.8;
        }

        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      <div className="max-w-md w-full text-center relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="w-20 h-20 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Lock className="w-10 h-10 text-lime-600" />
          </div>

          <h1 className="text-4xl font-black text-gray-900 mb-3 animate-bounce" dir="rtl">
            قريباً
          </h1>

          <p className="text-gray-600 text-lg mb-4" dir="rtl">
            نحن نعمل على شيء مميز لك
          </p>

          <div className="bg-lime-50 rounded-lg p-4 border border-lime-200">
            <p className="text-sm text-gray-700 font-medium" dir="rtl">
              صفحة المجتمع قيد التطوير. ترقب الإطلاق قريباً! 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
