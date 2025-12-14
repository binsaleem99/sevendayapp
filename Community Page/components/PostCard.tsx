import React from 'react';
import { Post } from '../types';
import { Pin, MessageSquare, Heart, Lock, MoreHorizontal, UserPlus } from 'lucide-react';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 relative overflow-hidden group hover:border-gray-300 transition-colors">
      
      {/* Header */}
      <div className="p-5 pb-0 flex justify-between items-start">
        <div className="flex gap-3">
          <div className="relative">
             <img
                src={post.author.avatar_url}
                alt={post.author.full_name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
             />
             {/* Level Badge - Lime */}
             <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-lime-accent rounded-full flex items-center justify-center text-[10px] font-bold text-gray-900 border-2 border-white shadow-sm">
                 {post.author.level}
             </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-sm hover:underline cursor-pointer">
                {post.author.full_name}
              </h3>
              {post.author.is_admin && (
                  <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-bold">مسؤول</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span>{post.created_at}</span>
              <span>•</span>
              <span className="text-gray-700 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{post.category}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            {post.is_pinned && (
            <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold">
                <Pin className="w-3 h-3 fill-current" />
                <span>مثبت</span>
            </div>
            )}
            <button className="text-gray-400 hover:bg-gray-100 p-1 rounded transition-colors">
                <MoreHorizontal className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Content - Fully Visible for Everyone (Ungated) */}
      <div className="px-5 py-4 relative">
        <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
          {post.title}
        </h2>
        
        <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>

        {post.image_url && (
            <div className="mt-3 rounded-lg overflow-hidden border border-gray-100">
                <img src={post.image_url} alt="Post content" className="w-full h-auto object-cover max-h-96" />
            </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className={`px-5 py-3 border-t border-gray-100 flex items-center justify-between ${post.is_locked ? 'bg-gray-50/50' : 'bg-gray-50/30'}`}>
        <div className="flex gap-4">
            {/* If locked, disable interactions but show counts */}
            {post.is_locked ? (
                <div className="flex items-center gap-4 opacity-50 cursor-not-allowed" title="الأعضاء فقط يمكنهم المشاركة">
                    <div className="flex items-center gap-1.5 text-gray-500">
                        <Heart className="w-4 h-4" />
                        <span className="text-xs font-bold">{post.likes_count}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs font-bold">{post.comments_count}</span>
                    </div>
                </div>
            ) : (
                <>
                    <button className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors group/btn">
                        <Heart className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-xs font-bold">{post.likes_count}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs font-bold">{post.comments_count}</span>
                    </button>
                </>
            )}
        </div>

        {/* Friendly Call to Action for Guests */}
        {post.is_locked ? (
            <button className="flex items-center gap-1.5 bg-lime-100 hover:bg-lime-200 text-lime-800 border border-lime-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">
                <UserPlus className="w-3.5 h-3.5" />
                <span>انضم للمشاركة</span>
            </button>
        ) : (
            post.participants && post.participants.length > 0 && (
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 space-x-reverse">
                        {post.participants.map((avatar, i) => (
                            <img key={i} src={avatar} alt="Participant" className="w-6 h-6 rounded-full border-2 border-white shadow-sm" />
                        ))}
                    </div>
                </div>
            )
        )}
      </div>

      {/* Comments - Visible but ReadOnly if locked */}
      {post.comments && post.comments.length > 0 && (
          <CommentSection comments={post.comments} isReadOnly={post.is_locked} />
      )}
    </div>
  );
};

export default PostCard;