'use client';

import { useState } from 'react';
import PinchZoomImage from './PinchZoomImage';
import PhotoFeedItem from './PhotoFeedItem';
import ProfileAvatar from './ProfileAvatar';
import { CONTENT_LIMITS } from '@/constants/app';
import { checkPhotoAge } from '@/lib/photoMetadata';
import type { UserSubmissionDisplayProps } from '@/types/components';


export default function UserSubmissionDisplay({
  userResponse,
  user,
  onUpdate,
  isUpdating,
  message,
  challengeStartDate,
}: UserSubmissionDisplayProps) {
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [editedCaption, setEditedCaption] = useState(userResponse.caption);
  const [editedPhoto, setEditedPhoto] = useState<File | null>(null);
  const [photoAgeWarning, setPhotoAgeWarning] = useState<string | null>(null);

  const handleStartInlineEdit = () => {
    setEditedCaption(userResponse.caption);
    setEditedPhoto(null);
    setPhotoAgeWarning(null);
    setIsEditingInline(true);
  };

  const handleCancelInlineEdit = () => {
    setIsEditingInline(false);
    setEditedCaption(userResponse.caption);
    setEditedPhoto(null);
    setPhotoAgeWarning(null);
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
    <div className="mb-8 bg-app-bg">      
      {/* Full-width submission display */}
      {isEditingInline ? (
        /* Editing Mode - Keep original structure for complex editing UI */
        <div className="border-t border-app-border pt-4">
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
                    timeZoneName: 'short',
                  })}
                </p>
              </div>
            </div>
          </div>
          
          {/* Editing Image */}
          <div className="relative w-full max-w-2xl mx-auto">
            <div className="relative">
              <PinchZoomImage
                src={editedPhoto ? URL.createObjectURL(editedPhoto) : userResponse.imageUrl}
                alt="Your submission"
                width={800}
                height={600}
                className="w-full h-auto object-contain bg-app-surface-dark"
                style={{ maxHeight: '70vh' }}
                priority={false}
                overlay={
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <label className="bg-app-surface text-app-text px-4 py-3 rounded-lg cursor-pointer hover:bg-app-surface-light transition-colors border border-app-border pointer-events-auto">
                      <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditedPhoto(file);

                            // Check photo age when selecting a new photo
                            const ageWarning = await checkPhotoAge(file, challengeStartDate);
                            setPhotoAgeWarning(ageWarning);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                }
              />
            </div>
          </div>
          
          {/* Editing Caption */}
          <div className="px-4 pt-3 pb-6 max-w-2xl mx-auto">
            <div className="space-y-3">
              <div className="space-y-2">
                <textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  className="w-full p-3 bg-app-surface border border-app-border text-app-text placeholder-app-text-muted rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Write a caption..."
                  maxLength={CONTENT_LIMITS.CAPTION_MAX_LENGTH}
                />
                <div className="text-xs text-app-text-muted text-right">
                  {editedCaption.length}/{CONTENT_LIMITS.CAPTION_MAX_LENGTH}
                </div>
              </div>
              {/* Photo Age Warning */}
              {photoAgeWarning && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{photoAgeWarning}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Display Mode - Use PhotoFeedItem */
        <div className="">
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
                className="px-3 py-1.5 text-sm font-medium text-white bg-[#3a8e8c] hover:bg-[#2d6b6a] focus:outline-none rounded-lg transition-colors"
                title="Edit submission"
              >
                Edit
              </button>
            }
          />
        </div>
      )}

      {/* Save/Cancel buttons for inline editing */}
      {isEditingInline && (
        <div className="py-4">
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
                className="px-6 py-2 bg-[#3a8e8c] text-white rounded-lg hover:bg-[#2d6b6a] focus:outline-none focus:ring-2 focus:ring-[#3a8e8c] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error messages only */}
      {message && message.type === 'error' && (
        <div className="bg-app-surface border-t border-app-border py-4">
          <div className="max-w-2xl mx-auto px-4">
            <div className="p-3 rounded-lg text-sm bg-app-error-bg border border-app-error text-app-error">
              {message.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}