'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { FILE_LIMITS } from '@/constants/app';
import type { PhotoUploadProps } from '@/types/components';


export default function PhotoUpload({ 
  onPhotoSelected, 
  onError,
  selectedPhoto, 
  previewUrl, 
  disabled = false 
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (disabled) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > FILE_LIMITS.PHOTO_MAX_SIZE) {
      onError?.(`File size must be less than ${FILE_LIMITS.PHOTO_MAX_SIZE / (1024 * 1024)}MB`);
      return;
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);
    onPhotoSelected(file, preview);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const removePhoto = () => {
    if (disabled) return;
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onPhotoSelected(null, '');
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (previewUrl) {
    return (
      <div className="relative">
        <div className="relative rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={previewUrl}
            alt="Preview"
            width={800}
            height={600}
            className="w-full h-auto object-contain bg-gray-50 max-h-[400px]"
          />
          {!disabled && (
            <button
              onClick={removePhoto}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              title="Remove photo"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
      
      <button
        onClick={openFileDialog}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Upload Photo
      </button>
    </div>
  );
}