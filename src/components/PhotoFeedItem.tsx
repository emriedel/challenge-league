'use client';

import Image from 'next/image';
import ProfileAvatar from './ProfileAvatar';

interface PhotoFeedItemProps {
  user: {
    username: string;
    profilePhoto?: string | null;
  };
  imageUrl: string;
  caption: string;
  submittedAt?: string | Date;
  // Optional header content (right side of header)
  headerActions?: React.ReactNode;
  // Optional overlay content on the image
  imageOverlay?: React.ReactNode;
  // Optional click handler for image
  onImageClick?: () => void;
  // Optional footer content below caption
  footerContent?: React.ReactNode;
  // Optional metadata to show in header
  metadata?: {
    rank?: number;
    votes?: number;
    date?: string;
  };
  // CSS classes for customization
  className?: string;
  imageClassName?: string;
  // Whether this is the first image (LCP optimization)
  priority?: boolean;
}

export default function PhotoFeedItem({
  user,
  imageUrl,
  caption,
  submittedAt,
  headerActions,
  imageOverlay,
  onImageClick,
  footerContent,
  metadata,
  className = '',
  imageClassName = '',
  priority = false
}: PhotoFeedItemProps) {
  const formatSubmittedDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className={`border-t border-app-border pt-4 ${className}`}>
      {/* Header with user info and optional actions */}
      <div className="px-4 py-3 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ProfileAvatar 
              username={user.username}
              profilePhoto={user.profilePhoto}
              size="sm"
            />
            <div>
              <p className="font-semibold text-app-text">{user.username}</p>
              {(submittedAt || metadata?.date) && (
                <p className="text-sm text-app-text-muted">
                  {metadata?.date || (submittedAt ? formatSubmittedDate(submittedAt) : '')}
                </p>
              )}
            </div>
          </div>
          
          {/* Right side content - actions or metadata */}
          <div className="flex items-center space-x-4">
            {metadata && (metadata.rank !== undefined || metadata.votes !== undefined) && (
              <div className="text-right">
                <p className="text-sm text-app-text-muted">
                  {metadata.rank !== undefined && `#${metadata.rank}`}
                  {metadata.rank !== undefined && metadata.votes !== undefined && ' • '}
                  {metadata.votes !== undefined && `${metadata.votes} ${metadata.votes === 1 ? 'vote' : 'votes'}`}
                </p>
              </div>
            )}
            {headerActions}
          </div>
        </div>
      </div>
      
      {/* Full-width Image */}
      <div 
        className={`relative w-full max-w-2xl mx-auto ${onImageClick ? 'cursor-pointer select-none' : ''}`}
        onClick={onImageClick}
        style={onImageClick ? { WebkitTapHighlightColor: 'transparent' } : undefined}
      >
        <Image
          src={imageUrl}
          alt={caption}
          width={800}
          height={600}
          className={`w-full h-auto object-contain bg-app-surface-dark ${imageClassName}`}
          style={{ maxHeight: '80vh' }}
          priority={priority}
        />
        {imageOverlay}
      </div>
      
      {/* Caption */}
      <div className="px-4 pt-3 pb-6 max-w-2xl mx-auto">
        <p className="text-app-text leading-relaxed">
          <span className="font-semibold">{user.username}</span>{' '}
          <span>{caption}</span>
        </p>
      </div>
      
      {/* Optional footer content */}
      {footerContent}
    </div>
  );
}