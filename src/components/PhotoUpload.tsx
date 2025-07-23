'use client';

import { useState, useRef } from 'react';

interface PhotoUploadProps {
  onPhotoSelected: (file: File | null, previewUrl: string) => void;
  selectedPhoto?: File | null;
  previewUrl?: string | null;
  disabled?: boolean;
}

export default function PhotoUpload({ 
  onPhotoSelected, 
  selectedPhoto, 
  previewUrl, 
  disabled = false 
}: PhotoUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (disabled) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
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
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-64 object-cover"
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
        {selectedPhoto && (
          <div className="mt-2 text-sm text-gray-500">
            <p>{selectedPhoto.name}</p>
            <p>{(selectedPhoto.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
        )}
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
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-primary-500 bg-primary-50'
            : disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <div className={`text-gray-400 mb-4 ${disabled ? 'opacity-50' : ''}`}>
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        
        <div className={disabled ? 'opacity-50' : ''}>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload your photo
          </h3>
          <p className="text-gray-500 mb-2">
            Drag and drop your image here, or click to select
          </p>
          <p className="text-sm text-gray-400">
            Supports: JPG, PNG, GIF, WebP (Max 10MB)
          </p>
        </div>
      </div>
    </div>
  );
}