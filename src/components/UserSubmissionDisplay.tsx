'use client';

import { useState } from 'react';
import Image from 'next/image';
import PhotoFeedItem from './PhotoFeedItem';
import ProfileAvatar from './ProfileAvatar';
import { CONTENT_LIMITS } from '@/constants/app';
import type { UserSubmissionDisplayProps } from '@/types/components';


export default function UserSubmissionDisplay({ 
  userResponse, 
  user, 
  onUpdate, 
  isUpdating, 
  message 
}: UserSubmissionDisplayProps) {
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [editedCaption, setEditedCaption] = useState(userResponse.caption);
  const [editedPhoto, setEditedPhoto] = useState<File | null>(null);

  const handleStartInlineEdit = () => {
    setEditedCaption(userResponse.caption);
    setEditedPhoto(null);
    setIsEditingInline(true);
  };

  const handleCancelInlineEdit = () => {
    setIsEditingInline(false);
    setEditedCaption(userResponse.caption);
    setEditedPhoto(null);
  };

  const handleSaveInlineEdit = async () => {
    await onUpdate({
      photo: editedPhoto || undefined,
      caption: editedCaption,
    });
    setIsEditingInline(false);
    setEditedCaption(userResponse.caption);
    setEditedPhoto(null);
  };

  return (
    <div className="space-y-6 mb-8 bg-app-bg">      
      {/* Full-width submission display */}
      {isEditingInline ? (
        /* Editing Mode - Keep original structure for complex editing UI */
        <div>
          {/* Header with user info */}
          <div className="px-4 py-3 max-w-2xl mx-auto">
            <div className="flex items-center space-x-3">
              <ProfileAvatar 
                username={user.username}
                profilePhoto={user.profilePhoto}
                size="sm"
              />
              <div>
                <p className="font-semibold text-app-text">{user.username}</p>
                <p className="text-sm text-app-text-muted">
                  {new Date(userResponse.submittedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
          
          {/* Editing Image */}
          <div className="relative w-full max-w-2xl mx-auto">
            <div className="relative">
              <Image
                src={editedPhoto ? URL.createObjectURL(editedPhoto) : userResponse.imageUrl}
                alt="Your submission"
                width={800}
                height={600}
                className="w-full h-auto object-contain bg-app-surface-dark"
                style={{ maxHeight: '70vh' }}
                priority={false}
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <label className="bg-app-surface text-app-text-secondary px-4 py-2 rounded-lg cursor-pointer hover:bg-app-surface-light transition-colors">
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditedPhoto(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
          
          {/* Editing Caption */}
          <div className="px-4 pt-3 pb-8 max-w-2xl mx-auto">
            <div className="space-y-3">
              <p className="text-app-text leading-relaxed">
                <span className="font-semibold">{user.username}</span>{' '}
              </p>
              <textarea
                value={editedCaption}
                onChange={(e) => setEditedCaption(e.target.value)}
                className="w-full p-3 bg-app-surface border border-app-border text-app-text placeholder-app-text-muted rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Write a caption..."
                maxLength={CONTENT_LIMITS.CAPTION_MAX_LENGTH}
              />
              <div className="text-xs text-app-text-muted text-right">
                {editedCaption.length}/{CONTENT_LIMITS.CAPTION_MAX_LENGTH}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Display Mode - Use PhotoFeedItem */
        <PhotoFeedItem
          user={{
            username: user.username,
            profilePhoto: user.profilePhoto
          }}
          imageUrl={userResponse.imageUrl}
          caption={userResponse.caption}
          submittedAt={userResponse.submittedAt}
          headerActions={
            <button
              onClick={handleStartInlineEdit}
              className="text-app-text-muted hover:text-app-text-secondary focus:outline-none p-3"
              title="Edit submission"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          }
          imageClassName="border border-gray-900 rounded-sm"
        />
      )}

      {/* Save/Cancel buttons for inline editing */}
      {isEditingInline && (
        <div className="border-t border-app-border pt-4 bg-app-surface">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleCancelInlineEdit}
                disabled={isUpdating}
                className="px-6 py-2 border border-app-border text-app-text-secondary rounded-lg hover:bg-app-surface-light focus:outline-none focus:ring-2 focus:ring-app-border focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInlineEdit}
                disabled={isUpdating || editedCaption.trim().length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            <p className="text-sm text-app-text-muted mt-2 text-center">
              You can update your submission until the deadline
            </p>
          </div>
        </div>
      )}
      
      {/* Success/Error messages */}
      {message && (
        <div className="bg-app-surface border-t border-app-border pt-4">
          <div className="max-w-2xl mx-auto px-4">
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}