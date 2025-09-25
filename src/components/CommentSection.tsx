'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProfileAvatar from './ProfileAvatar';
import type { Comment } from '@/types';

interface CommentSectionProps {
  responseId: string;
  showInput?: boolean; // Whether to show comment input (voting phase)
  collapsed?: boolean; // Whether to show collapsed view (results page)
  onCommentCountChange?: (count: number) => void;
}

interface CommentData {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    profilePhoto?: string | null;
  };
  canEdit: boolean;
  isOwn: boolean;
}

export default function CommentSection({ 
  responseId, 
  showInput = false, 
  collapsed = false,
  onCommentCountChange 
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [canComment, setCanComment] = useState(false);
  const [showAll, setShowAll] = useState(!collapsed);

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const response = await fetch(`/api/comments?responseId=${responseId}`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
          setCanComment(data.canComment || false);
          onCommentCountChange?.(data.comments?.length || 0);
        }
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [responseId, onCommentCountChange]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSubmit = editingCommentId ? editingText.trim() : commentText.trim();
    if (!textToSubmit || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId,
          text: textToSubmit
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (editingCommentId) {
          // Update existing comment
          setComments(prev => prev.map(c => 
            c.id === editingCommentId ? data.comment : c
          ));
          setEditingCommentId(null);
          setEditingText('');
        } else {
          // Add new comment
          setComments(prev => [...prev, data.comment]);
          onCommentCountChange?.(comments.length + 1);
          setCommentText('');
          setShowCommentForm(false);
        }
      } else {
        const error = await response.json();
        console.error('Failed to submit comment:', error.message);
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = (comment: CommentData) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        onCommentCountChange?.(comments.length - 1);
      } else {
        const error = await response.json();
        console.error('Failed to delete comment:', error.message);
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const formatCommentTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="px-4 py-2">
        <div className="animate-pulse text-sm text-app-text-muted">Loading comments...</div>
      </div>
    );
  }

  // Show collapsed view for results page
  if (collapsed && comments.length > 0) {
    const previewComment = comments[0];
    return (
      <div className="px-4 pt-3 pb-8">
        {showAll ? (
          <div>
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3 mb-4 last:mb-2">
                <ProfileAvatar
                  username={comment.author.username}
                  profilePhoto={comment.author.profilePhoto}
                  size="xs"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm text-app-text">{comment.author.username}</span>
                    <span className="text-xs text-app-text-muted">{formatCommentTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-app-text">{comment.text}</p>
                </div>
              </div>
            ))}
            {comments.length > 1 && (
              <button
                onClick={() => setShowAll(false)}
                className="text-sm text-app-text-muted hover:text-app-text mt-1"
              >
                Show less
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex space-x-3 mb-2">
              <ProfileAvatar
                username={previewComment.author.username}
                profilePhoto={previewComment.author.profilePhoto}
                size="xs"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-sm text-app-text">{previewComment.author.username}</span>
                  <span className="text-xs text-app-text-muted">{formatCommentTime(previewComment.createdAt)}</span>
                </div>
                <p className="text-sm text-app-text">{previewComment.text}</p>
              </div>
            </div>
            {comments.length > 1 && (
              <button
                onClick={() => setShowAll(true)}
                className="text-sm text-app-text-muted hover:text-app-text mt-1"
              >
                View all {comments.length} comments
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      {/* Comments list */}
      {comments.length > 0 && (
        <div className="mb-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3 mt-3">
              <ProfileAvatar
                username={comment.author.username}
                profilePhoto={comment.author.profilePhoto}
                size="xs"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-sm text-app-text">{comment.author.username}</span>
                  <span className="text-xs text-app-text-muted">{formatCommentTime(comment.createdAt)}</span>
                </div>
                
                {editingCommentId === comment.id ? (
                  /* Inline editing form */
                  <form onSubmit={handleSubmitComment} className="space-y-2">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-app-surface border border-app-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-app-text placeholder-app-text-muted"
                      rows={2}
                      maxLength={500}
                      autoFocus
                    />
                    <div className="flex justify-between items-center">
                      {editingText.length > 450 && (
                        <span className="text-xs text-app-text-muted">
                          {500 - editingText.length} characters remaining
                        </span>
                      )}
                      <div className="flex space-x-2 ml-auto">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-xs text-app-text-muted hover:text-app-text"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!editingText.trim() || submitting}
                          className="px-3 py-1 text-xs bg-[#3a8e8c] text-white rounded hover:bg-[#2d6b6a] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? 'Updating...' : 'Update'}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  /* Display comment */
                  <div>
                    <p className="text-sm text-app-text mb-1">{comment.text}</p>
                    {comment.canEdit && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEditComment(comment)}
                          className="text-xs text-app-text-muted hover:text-app-text"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-app-text-muted hover:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment form - only show if no comments exist yet */}
      {showInput && canComment && comments.length === 0 && (
        <div>
          {!showCommentForm ? (
            <div className="mt-2">
              <button
                onClick={() => setShowCommentForm(true)}
                className="flex items-center space-x-2 text-sm text-app-text-muted hover:text-app-text"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A3.969 3.969 0 006 21c.085 0 .18-.011.304-.030a7.484 7.484 0 001.765-.575c.621-.335 1.338-.532 2.092-.532.9 0 1.788.166 2.652.477C13.456 20.12 14.744 20.25 16 20.25h-4z" />
                </svg>
                <span>Add a comment...</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitComment} className="space-y-2 mt-2">
              <div className="flex space-x-3">
                <ProfileAvatar
                  username={session?.user?.username || ''}
                  profilePhoto={session?.user?.profilePhoto}
                  size="xs"
                />
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-3 py-2 text-sm bg-app-surface border border-app-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-app-text placeholder-app-text-muted"
                    rows={2}
                    maxLength={500}
                    autoFocus
                  />
                  <div className="flex justify-between items-center mt-2">
                    {commentText.length > 450 && (
                      <span className="text-xs text-app-text-muted">
                        {500 - commentText.length} characters remaining
                      </span>
                    )}
                    <div className="flex space-x-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCommentForm(false);
                          setCommentText('');
                        }}
                        className="px-3 py-1 text-xs text-app-text-muted hover:text-app-text"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!commentText.trim() || submitting}
                        className="px-3 py-1 text-xs bg-[#3a8e8c] text-white rounded hover:bg-[#2d6b6a] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}