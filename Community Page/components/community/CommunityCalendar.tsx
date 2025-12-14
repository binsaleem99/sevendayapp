import React from 'react';
import { CalendarEvent } from '../../types';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

const CommunityCalendar: React.FC = () => {
  const events: CalendarEvent[] = [
    {
      id: '1',
      title: 'جلسة أسئلة وأجوبة أسبوعية',
      description: 'انضم إلينا في لقاء مباشر للإجابة على جميع استفساراتكم البرمجية ومناقشة تحديات الأسبوع.',
      date: '2024-02-25',
      time: '08:00 مساءً',
      attendees_count: 45,
      is_online: true,
      image_url: 'https://picsum.photos/seed/event1/800/400'
    },
    {
      id: '2',
      title: 'ورشة عمل: تحسين أداء React',
      description: 'سنتعلم سوياً كيف نستخدم React Profiler ونكتشف مشاكل الأداء في تطبيقاتنا.',
      date: '2024-02-28',
      time: '06:30 مساءً',
      attendees_count: 120,
      is_online: true
    },
    {
      id: '3',
      title: 'لقاء المطورين - الكويت',
      description: 'لقاء حضوري للتعارف وتبادل الخبرات بين مطوري المجتمع في الكويت.',
      date: '2024-03-05',
      time: '05:00 مساءً',
      attendees_count: 15,
      is_online: false
    }
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-gray-900">الفعاليات القادمة</h2>
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">
            <CalendarIcon className="w-3 h-3" />
            <span>تزامن</span>
        </button>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-gray-300 transition-all flex flex-col md:flex-row gap-6 group">
            
            {/* Date Box */}
            <div className="flex-shrink-0 flex flex-row md:flex-col items-center justify-center bg-gray-50 rounded-lg p-4 md:w-24 border border-gray-100 group-hover:border-lime-200 group-hover:bg-lime-50 transition-colors">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider md:mb-1">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
              <span className="text-3xl font-black text-gray-900 mx-2 md:mx-0">{new Date(event.date).getDate()}</span>
              <span className="text-xs text-gray-400 font-medium">{new Date(event.date).toLocaleDateString('ar-EG', { weekday: 'long' })}</span>
            </div>

            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                <div>
                   <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-lime-600 transition-colors">{event.title}</h3>
                   <div className="flex flex-wrap gap-4 text-xs text-gray-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{event.is_online ? 'مباشر على Zoom' : 'حضوري'}</span>
                      </div>
                   </div>
                </div>
                {event.is_online && (
                    <span className="self-start bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded animate-pulse">
                        LIVE
                    </span>
                )}
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {event.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex -space-x-2 space-x-reverse">
                    {[1,2,3].map(i => (
                        <div key={i} className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                           {i === 3 ? `+${event.attendees_count}` : ''}
                           {i !== 3 && <img src={`https://picsum.photos/seed/${i + event.id}/30/30`} className="w-full h-full rounded-full" />}
                        </div>
                    ))}
                </div>
                
                <button className="bg-white border border-gray-200 text-gray-900 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-lime-accent hover:border-lime-accent transition-all shadow-sm">
                    سجل حضورك
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityCalendar;