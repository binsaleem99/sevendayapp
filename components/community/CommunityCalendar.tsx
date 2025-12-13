import React from 'react';
import { Calendar, MapPin, Video, Users, Check, X as XIcon, Plus } from 'lucide-react';
import { CalendarEvent } from '../../types/community';

interface CommunityCalendarProps {
  events: any[]; // Enhanced with is_registered and is_full
  onRegister?: (eventId: string) => void;
  onUnregister?: (eventId: string) => void;
  onCreateEvent?: () => void;
  isAdmin?: boolean;
}

const CommunityCalendar: React.FC<CommunityCalendarProps> = ({
  events,
  onRegister,
  onUnregister,
  onCreateEvent,
  isAdmin = false
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('ar', { month: 'long' });
    return { day, month };
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[#CCFF00]" />
          <span>الفعاليات القادمة</span>
        </h2>
        {isAdmin && onCreateEvent && (
          <button
            onClick={onCreateEvent}
            className="flex items-center gap-2 px-4 py-2 bg-[#CCFF00] hover:bg-[#b8e600] text-gray-900 font-bold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة فعالية</span>
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {events.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">لا توجد فعاليات قادمة حالياً</p>
          </div>
        ) : (
          events.map((event) => {
            const { day, month } = formatDate(event.date);

            return (
              <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex gap-4">
                  {/* Date Badge */}
                  <div className="flex-shrink-0 w-16 h-16 bg-[#CCFF00] rounded-lg flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold text-gray-900">{day}</div>
                    <div className="text-xs text-gray-700">{month}</div>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">{event.title}</h3>

                    {event.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        {event.is_online ? (
                          <>
                            <Video className="w-4 h-4" />
                            <span>عبر الإنترنت</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4" />
                            <span>حضوري</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>{event.attendees_count} مشارك</span>
                      </div>

                      {event.time && (
                        <div className="flex items-center gap-1.5">
                          <span>🕐</span>
                          <span>{event.time}</span>
                        </div>
                      )}
                    </div>

                    {/* Event Image */}
                    {event.image_url && (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-32 object-cover rounded-lg mt-4"
                      />
                    )}

                    {/* Register/Unregister Buttons */}
                    <div className="mt-4 flex items-center gap-3">
                      {event.is_registered ? (
                        onUnregister && (
                          <button
                            onClick={() => onUnregister(event.id)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                          >
                            <XIcon className="w-4 h-4" />
                            <span>إلغاء التسجيل</span>
                          </button>
                        )
                      ) : (
                        onRegister && (
                          <button
                            onClick={() => onRegister(event.id)}
                            disabled={event.is_full}
                            className={`font-bold px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2 ${
                              event.is_full
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-[#CCFF00] hover:bg-[#b8e600] text-gray-900'
                            }`}
                          >
                            {event.is_full ? (
                              <>
                                <Users className="w-4 h-4" />
                                <span>الفعالية ممتلئة</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                <span>سجل الآن</span>
                              </>
                            )}
                          </button>
                        )
                      )}

                      {event.is_registered && (
                        <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          مسجل
                        </span>
                      )}

                      {event.max_attendees && (
                        <span className="text-sm text-gray-500">
                          {event.attendees_count} / {event.max_attendees} مقاعد
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommunityCalendar;
