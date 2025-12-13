import React, { useState } from 'react';
import { X, Calendar, Clock, Users, MapPin, Video, Image as ImageIcon } from 'lucide-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: {
    title: string;
    description: string;
    event_date: string;
    event_time: string;
    event_type: string;
    max_attendees?: number;
    is_online: boolean;
    location?: string;
    meeting_link?: string;
    image_url?: string;
  }) => Promise<void>;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    event_type: 'webinar',
    max_attendees: '',
    is_online: true,
    location: '',
    meeting_link: '',
    image_url: ''
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit({
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date,
        event_time: formData.event_time,
        event_type: formData.event_type,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined,
        is_online: formData.is_online,
        location: formData.location || undefined,
        meeting_link: formData.meeting_link || undefined,
        image_url: formData.image_url || undefined
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        event_type: 'webinar',
        max_attendees: '',
        is_online: true,
        location: '',
        meeting_link: '',
        image_url: ''
      });
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setSubmitting(false);
    }
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
          <h2 className="text-2xl font-bold text-gray-900">إنشاء فعالية جديدة</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              عنوان الفعالية *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
              placeholder="مثال: ورشة عمل البرمجة المتقدمة"
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
              rows={4}
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent resize-none"
              placeholder="اكتب وصفًا تفصيليًا للفعالية..."
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline ml-1" />
                التاريخ *
              </label>
              <input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline ml-1" />
                الوقت *
              </label>
              <input
                type="time"
                required
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
              />
            </div>
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              نوع الفعالية *
            </label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
            >
              <option value="webinar">ندوة إلكترونية</option>
              <option value="workshop">ورشة عمل</option>
              <option value="meetup">لقاء</option>
              <option value="qa_session">جلسة أسئلة وأجوبة</option>
              <option value="announcement">إعلان</option>
            </select>
          </div>

          {/* Max Attendees */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <Users className="w-4 h-4 inline ml-1" />
              الحد الأقصى للمشاركين (اختياري)
            </label>
            <input
              type="number"
              min="1"
              value={formData.max_attendees}
              onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
              placeholder="اترك فارغًا لعدد غير محدود"
            />
          </div>

          {/* Online/Offline Toggle */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="is_online"
              checked={formData.is_online}
              onChange={(e) => setFormData({ ...formData, is_online: e.target.checked })}
              className="w-5 h-5 text-[#CCFF00] border-gray-300 rounded focus:ring-[#CCFF00]"
            />
            <label htmlFor="is_online" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <Video className="w-4 h-4" />
              فعالية عبر الإنترنت
            </label>
          </div>

          {/* Meeting Link (if online) */}
          {formData.is_online && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Video className="w-4 h-4 inline ml-1" />
                رابط الاجتماع
              </label>
              <input
                type="url"
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
                placeholder="https://zoom.us/j/..."
              />
            </div>
          )}

          {/* Location (if offline) */}
          {!formData.is_online && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline ml-1" />
                الموقع
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
                placeholder="مثال: مركز الكويت للأعمال"
              />
            </div>
          )}

          {/* Image URL */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <ImageIcon className="w-4 h-4 inline ml-1" />
              رابط الصورة (اختياري)
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-[#CCFF00] text-gray-900 font-bold rounded-lg hover:bg-[#b8e600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'جاري الإنشاء...' : 'إنشاء الفعالية'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
