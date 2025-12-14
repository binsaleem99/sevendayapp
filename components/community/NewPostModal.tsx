import React, { useState } from 'react';
import { X } from 'lucide-react';
import NewPostComposer from './NewPostComposer';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    category: string;
    imageUrl?: string
  }) => Promise<void>;
}

const NewPostModal: React.FC<NewPostModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (data: {
    title: string;
    content: string;
    category: string;
    imageUrl?: string
  }) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}
           dir="rtl">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">إنشاء منشور جديد</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <NewPostComposer onSubmit={handleSubmit} isLoading={submitting} />
        </div>
      </div>
    </div>
  );
};

export default NewPostModal;
