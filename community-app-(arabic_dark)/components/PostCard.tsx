import React from 'react';
import { Post } from '../types';
import { Pin, MessageSquare, Heart, Lock, MoreHorizontal } from 'lucide-react';
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

      {/* Content */}
      <div className="px-5 py-4 relative">
        <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
          {post.title}
        </h2>
        
        <div className={`text-gray-800 text-sm leading-relaxed whitespace-pre-wrap ${post.is_locked ? 'blur-sm select-none opacity-50 h-24 overflow-hidden' : ''}`}>
          {post.content}
        </div>

        {post.image_url && !post.is_locked && (
            <div className="mt-3 rounded-lg overflow-hidden border border-gray-100">
                <img src={post.image_url} alt="Post content" className="w-full h-auto object-cover max-h-96" />
            </div>
        )}

        {/* Locked Overlay */}
        {post.is_locked && (
          <div className="absolute inset-0 top-10 flex flex-col items-center justify-center z-10">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center max-w-sm mx-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                 <Lock className="w-5 h-5 text-gray-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">محتوى حصري للأعضاء</h3>
              <p className="text-gray-500 text-xs mb-4">
                انضم للمجتمع لتتمكن من رؤية هذا المحتوى والمشاركة في النقاشات.
              </p>
              <button className="w-full bg-lime-accent hover:bg-lime-hover text-gray-900 font-bold py-2 px-4 rounded-lg transition-all text-sm shadow-sm border border-transparent hover:border-lime-600/20">
                اشترك الآن - 9 د.ك/شهر
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
        <div className="flex gap-4">
          <button className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors group/btn">
            <Heart className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            <span className="text-xs font-bold">{post.likes_count}</span>
          </button>
          <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-bold">{post.comments_count}</span>
          </button>
        </div>

        {/* Participants */}
        {post.participants && post.participants.length > 0 && (
            <div className="flex items-center gap-3">
                <div className="flex -space-x-2 space-x-reverse">
                    {post.participants.map((avatar, i) => (
                        <img key={i} src={avatar} alt="Participant" className="w-6 h-6 rounded-full border-2 border-white shadow-sm" />
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Comments */}
      {!post.is_locked && post.comments && post.comments.length > 0 && (
          <CommentSection comments={post.comments} />
      )}
    </div>
  );
};

export default PostCard;
