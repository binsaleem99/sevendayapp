import React from 'react';
import { Comment } from '../types';
import { Heart } from 'lucide-react';

interface CommentSectionProps {
  comments?: Comment[];
  isReadOnly?: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments = [], isReadOnly = false }) => {
  if (comments.length === 0) return null;

  return (
    <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <img
            src={comment.author.avatar}
            alt={comment.author.name}
            className="w-8 h-8 rounded-full border border-gray-200 mt-1"
          />
          <div className="flex-1">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 inline-block max-w-[95%] shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-xs text-gray-900">
                  {comment.author.name}
                </span>
                {comment.author.level && (
                    <span className="text-[10px] bg-lime-100 text-gray-700 px-1.5 py-0.5 rounded-full font-bold">
                        L{comment.author.level}
                    </span>
                )}
                <span className="text-[10px] text-gray-400">{comment.createdAt}</span>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">
                {comment.content}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-1 mr-2 text-[10px] text-gray-500 font-bold">
              <button className={`flex items-center gap-1 transition-colors ${isReadOnly ? 'cursor-default opacity-60' : 'hover:text-red-500'}`}>
                <Heart className="w-3 h-3" />
                <span>{comment.likes}</span>
              </button>
              {!isReadOnly && (
                <button className="hover:text-gray-800 transition-colors">رد</button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentSection;