'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ProfileAvatar from './ProfileAvatar';
import { FILE_LIMITS } from '@/constants/app';

interface ProfilePhotoSetupProps {
  username: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function ProfilePhotoSetup({ username, onComplete, onSkip }: ProfilePhotoSetupProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size for profile photos
    if (file.size > FILE_LIMITS.PROFILE_PHOTO_MAX_SIZE) {
      setError(`File size must be less than ${FILE_LIMITS.PROFILE_PHOTO_MAX_SIZE / (1024 * 1024)}MB`);
      return;
    }

    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', fileInputRef.current.files[0]);

      const response = await fetch('/api/profile/photo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      // Navigate to complete the setup flow
      onComplete?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  return (
    <div className="bg-app-surface py-6 sm:py-8 px-6 shadow-xl rounded-2xl border border-app-border">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-app-text mb-2">Add Profile Photo</h2>
        <p className="text-app-text-secondary text-sm">
          Help others recognize you
        </p>
      </div>

      <div className="flex flex-col items-center space-y-4 sm:space-y-6">
        {/* Current/Preview Avatar */}
        <div className="relative">
          {preview ? (
            <div className="w-24 h-24 relative rounded-full overflow-hidden">
              <Image
                src={preview}
                alt="Profile preview"
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          ) : (
            <ProfileAvatar username={username} size="xl" />
          )}
        </div>

        {/* File Input */}
        <div className="w-full">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="profile-photo-input"
          />
          <label
            htmlFor="profile-photo-input"
            className="block w-full text-center bg-app-surface-dark border-2 border-dashed border-app-border-light rounded-xl p-4 cursor-pointer hover:bg-app-surface-light transition-colors"
          >
            <div className="text-blue-600">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-sm font-medium">Select a photo</p>
            </div>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full bg-app-error-bg border border-app-error text-app-error px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 w-full">
          <button
            onClick={handleSkip}
            disabled={uploading}
            className="flex-1 px-4 py-2.5 sm:py-3 text-app-text-secondary bg-app-surface-dark rounded-xl hover:bg-app-surface-light disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            Skip for now
          </button>
          
          <button
            onClick={handleUpload}
            disabled={!preview || uploading}
            className="flex-1 px-4 py-2.5 sm:py-3 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 font-semibold"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              'Save Photo'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}