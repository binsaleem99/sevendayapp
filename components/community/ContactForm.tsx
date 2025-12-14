import React, { useState } from 'react';
import { Send, Mail } from 'lucide-react';

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setSubmitting(false);

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: '', email: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-lime-700" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">تواصل معنا</h2>
        <p className="text-gray-500">هل تواجه مشكلة؟ نحن هنا لمساعدتك. املأ النموذج أدناه.</p>
      </div>

      {submitted ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">تم إرسال رسالتك بنجاح!</h3>
          <p className="text-gray-600">سنتواصل معك قريباً</p>
        </div>
      ) : (
        <form className="space-y-4 max-w-lg mx-auto" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">الاسم الكامل</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-colors"
              placeholder="أدخل اسمك"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-colors"
              placeholder="name@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">رسالتك</label>
            <textarea
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-colors resize-none"
              placeholder="اكتب تفاصيل مشكلتك هنا..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-gray-900 font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 mt-4 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                <span>جاري الإرسال...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>إرسال الرسالة</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default ContactForm;
