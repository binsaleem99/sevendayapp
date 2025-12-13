import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Pin, Trash2 } from 'lucide-react';

interface AdminPostMenuProps {
  postId: string;
  isPinned: boolean;
  onPin: () => void;
  onDelete: () => void;
}

const AdminPostMenu: React.FC<AdminPostMenuProps> = ({
  postId,
  isPinned,
  onPin,
  onDelete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePin = () => {
    onPin();
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.')) {
      onDelete();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="خيارات المنشور"
      >
        <MoreVertical className="w-5 h-5 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
          <button
            onClick={handlePin}
            className="w-full px-4 py-3 text-right flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <Pin className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {isPinned ? 'إلغاء التثبيت' : 'تثبيت المنشور'}
            </span>
          </button>

          <div className="border-t border-gray-100" />

          <button
            onClick={handleDelete}
            className="w-full px-4 py-3 text-right flex items-center gap-3 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-600">
              حذف المنشور
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPostMenu;
