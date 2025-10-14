'use client';

import { useRef, useState, memo } from 'react';
import { FILE_LIMITS } from '@/constants/app';
import { compressImage, formatFileSize, CompressionError, CompressionErrorType } from '@/lib/imageCompression';
import { checkPhotoAge } from '@/lib/photoMetadata';
import { logImageProcessingError, logClientError } from '@/lib/clientErrorLogger';
import type { PhotoUploadProps } from '@/types/components';


function PhotoUpload({
  onPhotoSelected,
  onError,
  selectedPhoto,
  previewUrl,
  disabled = false,
  challengeStartDate,
  onPhotoAgeWarning,
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (disabled || isCompressing) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      // Log validation failure
      await logClientError(
        'Invalid file type selected',
        undefined,
        {
          category: 'photo_upload_validation',
          fileType: file.type,
          fileName: file.name,
          fileSize: file.size,
        }
      );
      onError?.('Please select an image file');
      return;
    }

    // Validate file size (allow larger files since we'll compress them)
    if (file.size > FILE_LIMITS.PHOTO_MAX_SIZE) {
      // Log validation failure
      await logClientError(
        'File size exceeds limit',
        undefined,
        {
          category: 'photo_upload_validation',
          fileSize: file.size,
          maxSize: FILE_LIMITS.PHOTO_MAX_SIZE,
          fileName: file.name,
          fileType: file.type,
        }
      );
      onError?.(`File size must be less than ${FILE_LIMITS.PHOTO_MAX_SIZE / (1024 * 1024)}MB`);
      return;
    }

    setIsCompressing(true);

    try {
      // Check photo age metadata before compression
      // This should NEVER throw - it returns null on any error
      try {
        const ageWarning = await checkPhotoAge(file, challengeStartDate);
        if (ageWarning && onPhotoAgeWarning) {
          onPhotoAgeWarning(ageWarning);
        } else if (!ageWarning && onPhotoAgeWarning) {
          // Clear any existing warning
          onPhotoAgeWarning(null);
        }
      } catch (metadataError) {
        // Metadata extraction failed - log but continue
        console.warn('Photo metadata extraction failed (non-critical):', metadataError);
        // Clear any existing warning
        if (onPhotoAgeWarning) {
          onPhotoAgeWarning(null);
        }
      }

      // Compress the image with multiple fallback strategies
      // Returns both File object and blob URL for efficient preview
      const result = await compressImage(file, {
        maxWidth: 2560,
        maxHeight: 2560, // Allow large portrait photos
        quality: 0.90,
        maxSizeBytes: 1 * 1024 * 1024, // 1MB target
      });

      // Use the blob URL directly from compression result
      // This is more reliable than creating a new blob URL, especially on older devices
      onPhotoSelected(result.file, result.blobUrl);

      // Log compression results for debugging
      console.log(`✓ Compressed ${formatFileSize(file.size)} → ${formatFileSize(result.file.size)}`);
    } catch (error) {
      console.error('Image processing failed:', error);

      // Log error to backend for monitoring
      await logImageProcessingError(
        'Photo upload processing failed',
        file,
        error as Error,
        {
          category: 'photo_upload',
          compressionAttempted: true,
        }
      );

      // Provide specific, helpful error messages based on error type
      let userMessage = 'Failed to process image. Please try a different photo.';

      if (error instanceof CompressionError) {
        switch (error.type) {
          case CompressionErrorType.IMAGE_LOAD_FAILED:
            userMessage = 'Unable to load image. The file may be corrupted or in an unsupported format.';
            break;
          case CompressionErrorType.MEMORY_EXCEEDED:
            userMessage = 'Image is too large to process. Please try a smaller photo.';
            break;
          case CompressionErrorType.COMPRESSION_FAILED:
            userMessage = 'Image compression failed. Please try a different photo or reduce the file size.';
            break;
          case CompressionErrorType.CONTEXT_NOT_SUPPORTED:
            userMessage = 'Your browser doesn\'t support image processing. Please try a different browser.';
            break;
        }
      }

      onError?.(userMessage);
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

    // Clear any photo age warning
    if (onPhotoAgeWarning) {
      onPhotoAgeWarning(null);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (previewUrl) {
    return (
      <div className="relative">
        <div className="relative rounded-lg overflow-hidden bg-app-surface-dark">
          {/* Use standard img tag for blob URLs - Next.js Image can't handle them */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-auto object-contain bg-app-surface-dark max-h-[400px] rounded-lg"
            onError={(e) => {
              console.error('Failed to load photo preview:', e);
              // Log to backend for monitoring
              logClientError(
                'Photo preview failed to display',
                undefined,
                {
                  category: 'photo_preview',
                  previewUrl: previewUrl.substring(0, 50), // First 50 chars only
                }
              );
              // Show error to user
              onError?.('Failed to display photo preview. Please try selecting the photo again.');
            }}
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
        className="flex items-center justify-center gap-2 w-3/4 sm:w-full max-w-md mx-auto px-6 sm:px-8 py-3 bg-[#3a8e8c] text-white rounded-lg hover:bg-[#2f7574] disabled:bg-app-surface-light disabled:cursor-not-allowed transition-colors text-lg font-medium"
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

// Memoize the component to prevent re-renders when parent re-renders but props haven't changed
export default memo(PhotoUpload);