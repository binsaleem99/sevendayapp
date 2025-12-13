import React, { useState } from 'react';
import { File, Download, MessageCircle, Heart, Plus, Trash2 } from 'lucide-react';
import { FileItem } from '../../types/community';
import CommentSection from './CommentSection';

interface FileHubProps {
  files: FileItem[];
  onDownload?: (fileId: string, fileUrl: string) => void;
  onDelete?: (fileId: string) => void;
  onUpload?: () => void;
  isAdmin?: boolean;
}

const FileHub: React.FC<FileHubProps> = ({ files, onDownload, onDelete, onUpload, isAdmin = false }) => {
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
          <File className="w-6 h-6 text-[#CCFF00]" />
          <span>مركز الملفات</span>
        </h2>
        {isAdmin && onUpload && (
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-4 py-2 bg-[#CCFF00] hover:bg-[#b8e600] text-gray-900 font-bold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>رفع ملف</span>
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {files.length === 0 ? (
          <div className="p-12 text-center">
            <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">لا توجد ملفات متاحة حالياً</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="p-6">
              <div className="flex gap-4">
                {/* File Icon/Image */}
                {file.image_url ? (
                  <img
                    src={file.image_url}
                    alt={file.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <File className="w-10 h-10 text-gray-400" />
                  </div>
                )}

                {/* File Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1 text-lg">{file.title}</h3>

                  {file.description && (
                    <p className="text-gray-600 text-sm mb-3">{file.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                    {file.version && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-bold">
                        {file.version}
                      </span>
                    )}

                    {file.size && (
                      <span>{file.size}</span>
                    )}

                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      <span>{file.download_count} تنزيل</span>
                    </div>

                    {file.upload_date && (
                      <span>{new Date(file.upload_date).toLocaleDateString('ar')}</span>
                    )}
                  </div>

                  {/* Author */}
                  {file.author && (
                    <div className="flex items-center gap-2 mb-4">
                      <img
                        src={file.author.avatar}
                        alt={file.author.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-600">{file.author.name}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {onDownload && (
                      <button
                        onClick={() => onDownload(file.id, file.file_url || '')}
                        className="bg-[#CCFF00] hover:bg-[#b8e600] text-gray-900 font-bold px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>تنزيل</span>
                      </button>
                    )}

                    {isAdmin && onDelete && (
                      <button
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذا الملف؟')) {
                            onDelete(file.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700 font-bold px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف</span>
                      </button>
                    )}

                    {file.comments && file.comments.length > 0 && (
                      <button
                        onClick={() => setExpandedFileId(expandedFileId === file.id ? null : file.id)}
                        className="text-gray-600 hover:text-gray-900 font-bold px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{file.comments.length} تعليق</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              {expandedFileId === file.id && file.comments && (
                <div className="mt-4">
                  <CommentSection
                    postId={file.id}
                    comments={file.comments}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileHub;
