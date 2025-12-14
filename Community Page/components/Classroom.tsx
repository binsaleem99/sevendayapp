import React from 'react';
import { Course } from '../types';
import { PlayCircle, CheckCircle } from 'lucide-react';

const Classroom: React.FC = () => {
  const courses: Course[] = [
    {
      id: '1',
      title: 'أساسيات البرمجة للمبتدئين',
      description: 'ابدأ رحلتك في عالم البرمجة من الصفر وتعلم الأساسيات التي ستحتاجها لبناء أي تطبيق.',
      image_url: 'https://picsum.photos/seed/course1/800/450',
      progress: 100,
      lessons_count: 12
    },
    {
      id: '2',
      title: 'بناء تطبيقات React المتقدمة',
      description: 'تعلم كيفية بناء تطبيقات ويب حديثة وسريعة باستخدام React و Next.js مع أفضل الممارسات.',
      image_url: 'https://picsum.photos/seed/course2/800/450',
      progress: 45,
      lessons_count: 24
    },
    {
      id: '3',
      title: 'تطوير تطبيقات الموبايل',
      description: 'اصنع تطبيقات تعمل على آيفون وأندرويد باستخدام React Native وكود واحد فقط.',
      image_url: 'https://picsum.photos/seed/course3/800/450',
      progress: 0,
      lessons_count: 18
    },
    {
      id: '4',
      title: 'التسويق للمطورين',
      description: 'كيف تسوق لنفسك ولمشاريعك كمبرمج وتزيد من دخلك الشهري.',
      image_url: 'https://picsum.photos/seed/course4/800/450',
      progress: 0,
      lessons_count: 8
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">الدورات التدريبية</h1>
        <p className="text-gray-500">مسارات تعليمية شاملة لتأخذك من الصفر إلى الاحتراف</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
            <div className="relative aspect-video bg-gray-100 overflow-hidden">
              <img 
                src={course.image_url} 
                alt={course.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <PlayCircle className="w-3 h-3" />
                <span>{course.lessons_count} درس</span>
              </div>
            </div>

            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-lime-600 transition-colors">
                {course.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2 h-10">
                {course.description}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>{course.progress === 100 ? 'مكتمل' : `${course.progress}% مكتمل`}</span>
                  {course.progress === 100 && <CheckCircle className="w-4 h-4 text-lime-600" />}
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-lime-accent rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              <button className={`w-full mt-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  course.progress > 0 
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-lime-accent text-gray-900 hover:bg-lime-hover'
              }`}>
                  {course.progress === 0 ? 'ابدأ الدورة' : 'استكمال الدورة'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Classroom;
