import React, { useState } from 'react';
import { Image, X, Send } from 'lucide-react';

interface NewPostComposerProps {
  onSubmit: (data: { title: string; content: string; category: string; imageUrl?: string }) => void;
  isLoading?: boolean;
}

const NewPostComposer: React.FC<NewPostComposerProps> = ({ onSubmit, isLoading }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'general' | 'announcements' | 'success' | 'help'>('general');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onSubmit({
        title: title.trim(),
        content: content.trim(),
        category,
        imageUrl: imageUrl.trim() || undefined
      });
      // Reset form
      setTitle('');
      setContent('');
      setCategory('general');
      setImageUrl('');
      setShowImageInput(false);
    }
  };

  const categoryLabels = {
    general: 'عام',
    announcements: 'إعلانات',
    success: 'قصص نجاح',
    help: 'مساعدة'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="font-bold text-gray-900 mb-4">إنشاء منشور جديد</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
            التصنيف
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                  category === cat
                    ? 'bg-[#CCFF00] text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
            العنوان
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="اكتب عنوان منشورك..."
            className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-right"
            required
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
            المحتوى
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="شارك أفكارك مع المجتمع..."
            rows={6}
            className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent resize-none text-right"
            required
          />
        </div>

        {/* Image URL Input */}
        {showImageInput ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => {
                  setShowImageInput(false);
                  setImageUrl('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
              <label className="block text-sm font-bold text-gray-700 text-right">
                رابط الصورة (اختياري)
              </label>
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-right"
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                className="mt-3 w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowImageInput(true)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Image className="w-4 h-4" />
            <span className="text-sm font-bold">إضافة صورة</span>
          </button>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading || !title.trim() || !content.trim()}
            className={`px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 ${
              isLoading || !title.trim() || !content.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#CCFF00] hover:bg-[#b8e600] text-gray-900'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>جارٍ النشر...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>نشر</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPostComposer;
