'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { FILE_LIMITS } from '@/constants/app';
import { compressImage, formatFileSize } from '@/lib/imageCompression';
import type { PhotoUploadProps } from '@/types/components';


export default function PhotoUpload({ 
  onPhotoSelected, 
  onError,
  selectedPhoto, 
  previewUrl, 
  disabled = false 
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (disabled || isCompressing) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file');
      return;
    }

    // Validate file size (allow larger files since we'll compress them)
    if (file.size > FILE_LIMITS.PHOTO_MAX_SIZE) {
      onError?.(`File size must be less than ${FILE_LIMITS.PHOTO_MAX_SIZE / (1024 * 1024)}MB`);
      return;
    }

    setIsCompressing(true);

    try {
      // Compress the image
      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        maxSizeBytes: 1 * 1024 * 1024, // 1MB target
      });

      // Create preview URL from compressed file
      const preview = URL.createObjectURL(compressedFile);
      onPhotoSelected(compressedFile, preview);
      
      // Log compression results for debugging
      console.log(`Compressed ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`);
    } catch (error) {
      console.error('Compression failed:', error);
      onError?.('Failed to process image. Please try a different photo.');
    } finally {
      setIsCompressing(false);
    }
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
    if (disabled || isCompressing) return;
    
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
        <div className="relative rounded-lg overflow-hidden bg-app-surface-dark">
          <Image
            src={previewUrl}
            alt="Preview"
            width={800}
            height={600}
            className="w-full h-auto object-contain bg-app-surface-dark max-h-[400px]"
          />
          {!disabled && !isCompressing && (
            <button
              onClick={removePhoto}
              className="absolute top-2 right-2 bg-gray-800 text-gray-300 rounded-full p-1.5 sm:p-2 aspect-square flex items-center justify-center hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
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
        disabled={disabled || isCompressing}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:bg-app-surface-light disabled:cursor-not-allowed transition-colors"
      >
        {isCompressing ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Compressing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Add Photo
          </>
        )}
      </button>
    </div>
  );
}