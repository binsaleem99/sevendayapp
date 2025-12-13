import React, { useState } from 'react';
import { Heart, Send } from 'lucide-react';
import { Comment } from '../../types/community';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onAddComment?: (content: string) => void;
  onLikeComment?: (commentId: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  onAddComment,
  onLikeComment
}) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && onAddComment && !submitting) {
      setSubmitting(true);
      try {
        await onAddComment(newComment);
        setNewComment('');
      } catch (error) {
        console.error('Error adding comment:', error);
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="border-t border-gray-100 bg-gray-50">
      {/* Comment Input */}
      <div className="p-6 pb-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="اكتب تعليقك..."
            className="flex-1 px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-right"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className={`px-4 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 ${
              newComment.trim() && !submitting
                ? 'bg-[#CCFF00] hover:bg-[#b8e600] text-gray-900'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'جاري الإرسال...' : 'إرسال'}</span>
          </button>
        </form>
      </div>

      {/* Comments List */}
      <div className="px-6 pb-6 space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-start gap-3">
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900 text-sm">{comment.author.name}</h4>
                  {comment.author.level && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                      مستوى {comment.author.level}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{comment.createdAt}</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>

                {/* Comment Actions */}
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => onLikeComment && onLikeComment(comment.id)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      (comment as any).user_liked
                        ? 'text-red-500'
                        : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        (comment as any).user_liked ? 'fill-red-500' : ''
                      }`}
                    />
                    <span className="text-xs font-bold">{comment.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">
            لا توجد تعليقات بعد. كن أول من يعلق!
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
