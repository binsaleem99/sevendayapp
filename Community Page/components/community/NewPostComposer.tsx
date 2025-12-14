import React, { useState } from 'react';
import { Image, Paperclip, Video, X } from 'lucide-react';

const NewPostComposer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 p-4">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <img 
            src="https://picsum.photos/seed/me/40/40" 
            alt="My Avatar" 
            className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
          />
        </div>
        <div className="flex-grow">
          {!isExpanded ? (
            <div 
                onClick={() => setIsExpanded(true)}
                className="w-full bg-gray-100 hover:bg-gray-200/70 cursor-text text-gray-500 rounded-lg px-4 py-3 text-sm transition-colors text-right"
            >
                اكتب شيئاً للمجتمع...
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in duration-200">
                <input
                    type="text"
                    placeholder="عنوان المنشور"
                    className="w-full bg-white text-gray-900 font-bold text-lg placeholder-gray-400 focus:outline-none border-b border-gray-100 pb-2"
                    autoFocus
                />
                <textarea
                    placeholder="اكتب شيئاً للمجتمع..."
                    className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-gray-300 min-h-[120px] resize-none border border-gray-200"
                />
                <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-full transition-colors">
                            <Image className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-full transition-colors">
                            <Video className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-full transition-colors">
                            <Paperclip className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsExpanded(false)}
                            className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium"
                        >
                            إلغاء
                        </button>
                        <button className="bg-lime-accent hover:bg-lime-hover text-gray-900 px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                            نشر
                        </button>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewPostComposer;