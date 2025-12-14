import React from 'react';
import { FileItem } from '../../types';
import { Download, FileBox, HardDrive, Calendar } from 'lucide-react';
import CommentSection from './CommentSection';

const CommunityFiles: React.FC = () => {
  const files: FileItem[] = [
    {
      id: '1',
      title: 'مشروع التجارة الإلكترونية (Full Stack)',
      description: 'كود مصدري كامل لتطبيق متجر إلكتروني مبني بواسطة React و Node.js. يحتوي على عربة تسوق، بوابة دفع، ولوحة تحكم.',
      version: 'v2.4.0',
      download_count: 342,
      size: '45 MB',
      upload_date: '2024-02-20',
      image_url: 'https://picsum.photos/seed/ecom/800/400',
      author: { name: 'Admin', avatar: 'https://picsum.photos/seed/admin/50/50' },
      comments: [
        {
            id: 'c1',
            author: { name: 'محمد علي', avatar: 'https://picsum.photos/seed/m1/50/50', level: 2 },
            content: 'الكود نظيف جداً وسهل الفهم. شكراً لك!',
            createdAt: 'منذ يومين',
            likes: 4
        }
      ]
    },
    {
      id: '2',
      title: 'قالب لوحة تحكم Dashboard Starter',
      description: 'قالب جاهز للبدء في بناء لوحات تحكم احترافية. يدعم الوضع المظلم واللغة العربية بشكل كامل.',
      version: 'v1.0.0',
      download_count: 1205,
      size: '12 MB',
      upload_date: '2024-02-15',
      author: { name: 'Admin', avatar: 'https://picsum.photos/seed/admin/50/50' },
      comments: []
    }
  ];

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900 mb-1">المكتبة</h2>
        <p className="text-sm text-gray-500">حمل أحدث الملفات والمشاريع المفتوحة المصدر</p>
      </div>

      <div className="space-y-6">
        {files.map((file) => (
          <div key={file.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:border-lime-300 transition-colors">
            
            {file.image_url && (
                <div className="h-40 w-full bg-gray-100 border-b border-gray-100">
                    <img src={file.image_url} alt={file.title} className="w-full h-full object-cover" />
                </div>
            )}

            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                   <h2 className="text-lg font-bold text-gray-900 mb-2">{file.title}</h2>
                   <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold">
                      <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                        <FileBox className="w-3 h-3" />
                        {file.version}
                      </span>
                      <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                        <HardDrive className="w-3 h-3" />
                        {file.size}
                      </span>
                      <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                        <Calendar className="w-3 h-3" />
                        {file.upload_date}
                      </span>
                   </div>
                </div>
                <button className="flex items-center gap-2 bg-lime-accent hover:bg-lime-hover text-gray-900 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل</span>
                    <span className="bg-white/30 px-1 rounded ml-1">{file.download_count}</span>
                </button>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {file.description}
              </p>

              <div className="pt-4 border-t border-gray-100">
                 <h3 className="font-bold text-gray-900 text-xs mb-3">التعليقات</h3>
                 <CommentSection comments={file.comments} />
                 <div className="mt-3 flex gap-2">
                    <img src="https://picsum.photos/seed/me/40/40" className="w-7 h-7 rounded-full" />
                    <input 
                        type="text" 
                        placeholder="أضف تعليقاً..." 
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-lime-500 transition-colors"
                    />
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityFiles;