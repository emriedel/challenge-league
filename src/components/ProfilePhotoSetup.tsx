'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ProfileAvatar from './ProfileAvatar';

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

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
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

      // Force refresh session to get updated user data
      window.location.reload();
      
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
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add a Profile Photo</h2>
        <p className="text-gray-600">
          Help others recognize you by adding a profile photo
        </p>
      </div>

      <div className="flex flex-col items-center space-y-6">
        {/* Current/Preview Avatar */}
        <div className="relative">
          {preview ? (
            <div className="w-24 h-24 relative rounded-full overflow-hidden">
              <img
                src={preview}
                alt="Profile preview"
                className="w-full h-full object-cover"
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
            className="block w-full text-center bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors"
          >
            <div className="text-blue-600">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-sm font-medium">Click to select a photo</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
            </div>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 w-full">
          <button
            onClick={handleSkip}
            disabled={uploading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip for now
          </button>
          
          <button
            onClick={handleUpload}
            disabled={!preview || uploading}
            className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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