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
    if (!confirm('Are you sure you want to delete this comment?')) return;

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
      <div className="px-4 pt-3 pb-4">
        {showAll ? (
          <div>
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3 mb-4 last:mb-2">
                <ProfileAvatar 
                  username={comment.author.username}
                  profilePhoto={comment.author.profilePhoto}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm text-app-text">{comment.author.username}</span>
                    <span className="text-xs text-app-text-muted">{formatCommentTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-app-text leading-relaxed">{comment.text}</p>
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
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-sm text-app-text">{previewComment.author.username}</span>
                  <span className="text-xs text-app-text-muted">{formatCommentTime(previewComment.createdAt)}</span>
                </div>
                <p className="text-sm text-app-text leading-relaxed">{previewComment.text}</p>
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
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-sm text-app-text">{comment.author.username}</span>
                  <span className="text-xs text-app-text-muted">{formatCommentTime(comment.createdAt)}</span>
                  {comment.updatedAt !== comment.createdAt && (
                    <span className="text-xs text-app-text-muted">(edited)</span>
                  )}
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
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? 'Updating...' : 'Update'}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  /* Display comment */
                  <div>
                    <p className="text-sm text-app-text leading-relaxed mb-1">{comment.text}</p>
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
            <button
              onClick={() => setShowCommentForm(true)}
              className="flex items-center space-x-2 text-sm text-app-text-muted hover:text-app-text mt-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 21l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
              <span>Add a comment...</span>
            </button>
          ) : (
            <form onSubmit={handleSubmitComment} className="space-y-2 mt-2">
              <div className="flex space-x-3">
                <ProfileAvatar 
                  username={session?.user?.username || ''}
                  profilePhoto={session?.user?.profilePhoto}
                  size="sm"
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
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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