import React, { useState } from 'react';
import { MessageCircle, Heart, Lock, Shield } from 'lucide-react';
import { Post } from '../../types/community';
import CommentSection from './CommentSection';
import AdminPostMenu from './AdminPostMenu';

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onLoadComments?: (postId: string) => void;
  onAddComment?: (postId: string, content: string) => void;
  onLikeComment?: (postId: string, commentId: string) => void;
  comments?: any[];
  isAdmin?: boolean;
  onPin?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onLoadComments,
  onAddComment,
  onLikeComment,
  comments = [],
  isAdmin = false,
  onPin,
  onDelete
}) => {
  const [showComments, setShowComments] = useState(false);

  const handleToggleComments = () => {
    if (!showComments && onLoadComments) {
      onLoadComments(post.id);
    }
    setShowComments(!showComments);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-3 mb-4">
          <img
            src={post.author.avatar_url}
            alt={post.author.full_name}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 truncate">{post.author.full_name}</h3>
              {post.author.is_admin && (
                <Shield className="w-4 h-4 text-[#CCFF00] flex-shrink-0" title="مشرف" />
              )}
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full flex-shrink-0">
                مستوى {post.author.level}
              </span>
            </div>
            <p className="text-sm text-gray-500">{post.created_at}</p>
          </div>
          {post.is_pinned && (
            <span className="px-3 py-1 bg-[#CCFF00] text-gray-900 text-xs font-bold rounded-full flex-shrink-0">
              مثبت
            </span>
          )}
          {isAdmin && onPin && onDelete && (
            <AdminPostMenu
              postId={post.id}
              isPinned={post.is_pinned}
              onPin={() => onPin(post.id)}
              onDelete={() => onDelete(post.id)}
            />
          )}
        </div>

        {/* Post Content */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full rounded-lg mt-4 object-cover"
            />
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={onLike}
            className="flex items-center gap-2 transition-colors text-gray-600 hover:text-red-500"
          >
            <Heart className="w-5 h-5" />
            <span className="text-sm font-bold">{post.likes_count}</span>
          </button>

          <button
            onClick={handleToggleComments}
            className="flex items-center gap-2 transition-colors text-gray-600 hover:text-blue-500"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-bold">{post.comments_count}</span>
          </button>

          {post.participants && post.participants.length > 0 && (
            <div className="flex items-center gap-1 mr-auto">
              <div className="flex -space-x-2">
                {post.participants.slice(0, 3).map((avatar, i) => (
                  <img
                    key={i}
                    src={avatar}
                    alt=""
                    className="w-6 h-6 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              {post.participants.length > 3 && (
                <span className="text-xs text-gray-500 font-medium mr-1">
                  +{post.participants.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          comments={comments}
          onAddComment={onAddComment ? (content) => onAddComment(post.id, content) : undefined}
          onLikeComment={onLikeComment ? (commentId) => onLikeComment(post.id, commentId) : undefined}
        />
      )}
    </div>
  );
};

export default PostCard;
