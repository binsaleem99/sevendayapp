import React, { useState, useRef } from 'react';
import { X, Upload, File as FileIcon, Image as ImageIcon, Tag } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File, metadata: {
    title: string;
    description: string;
    file_type: string;
    category: string;
    version: string;
    image_url?: string;
    tags?: string[];
  }) => Promise<void>;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_type: 'document',
    category: 'resource',
    version: 'v1.0',
    image_url: '',
    tags: ''
  });
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);

    // Auto-detect file type
    const type = file.type;
    let fileType = 'other';
    if (type.includes('image')) fileType = 'image';
    else if (type.includes('video')) fileType = 'video';
    else if (type.includes('pdf') || type.includes('document')) fileType = 'document';
    else if (type.includes('text') || type.includes('javascript') || type.includes('json')) fileType = 'code';

    setFormData(prev => ({ ...prev, file_type: fileType }));

    // Auto-fill title from filename
    if (!formData.title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setFormData(prev => ({ ...prev, title: nameWithoutExt }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const tags = formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      await onSubmit(selectedFile, {
        title: formData.title,
        description: formData.description,
        file_type: formData.file_type,
        category: formData.category,
        version: formData.version,
        image_url: formData.image_url || undefined,
        tags
      });

      // Reset form
      setSelectedFile(null);
      setFormData({
        title: '',
        description: '',
        file_type: 'document',
        category: 'resource',
        version: 'v1.0',
        image_url: '',
        tags: ''
      });
      onClose();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">رفع ملف جديد</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive
                ? 'border-[#CCFF00] bg-[#CCFF00]/10'
                : selectedFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <FileIcon className="w-12 h-12 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  إزالة الملف
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-gray-700 font-medium mb-1">
                    اسحب الملف وأفلته هنا
                  </p>
                  <p className="text-sm text-gray-500 mb-3">أو</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-[#CCFF00] hover:bg-[#b8e600] text-gray-900 font-bold rounded-lg transition-colors"
                  >
                    اختر ملفًا
                  </button>
                </div>
                <p className="text-xs text-gray-400">الحد الأقصى: 50 ميجابايت</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
          </div>

          {selectedFile && (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  عنوان الملف *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
                  placeholder="مثال: دليل البرمجة الشامل"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الوصف *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent resize-none"
                  placeholder="اكتب وصفًا تفصيليًا للملف..."
                />
              </div>

              {/* File Type & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    نوع الملف *
                  </label>
                  <select
                    value={formData.file_type}
                    onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
                  >
                    <option value="document">مستند</option>
                    <option value="image">صورة</option>
                    <option value="video">فيديو</option>
                    <option value="code">كود برمجي</option>
                    <option value="template">قالب</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    التصنيف *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
                  >
                    <option value="resource">مورد</option>
                    <option value="template">قالب</option>
                    <option value="guide">دليل</option>
                    <option value="tool">أداة</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              </div>

              {/* Version */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الإصدار
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
                  placeholder="v1.0"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline ml-1" />
                  الوسوم (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
                  placeholder="مثال: برمجة, تصميم, دليل"
                />
              </div>

              {/* Thumbnail Image URL */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <ImageIcon className="w-4 h-4 inline ml-1" />
                  رابط صورة العرض (اختياري)
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-[#CCFF00] text-gray-900 font-bold rounded-lg hover:bg-[#b8e600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'جاري الرفع...' : 'رفع الملف'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default FileUploadModal;
