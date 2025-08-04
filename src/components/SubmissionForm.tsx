'use client';

import { useState } from 'react';
import PhotoUpload from './PhotoUpload';
import { CONTENT_LIMITS } from '@/constants/app';

interface SubmissionFormProps {
  prompt: {
    id: string;
    text: string;
    weekEnd: string;
  };
  onSubmit: (data: { photo: File; caption: string }) => void;
  isSubmitting?: boolean;
}

export default function SubmissionForm({ prompt, onSubmit, isSubmitting = false }: SubmissionFormProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const handlePhotoSelected = (file: File | null, preview: string) => {
    if (file && preview) {
      setSelectedPhoto(file);
      setPreviewUrl(preview);
      setUploadError(null); // Clear any previous upload errors
    } else {
      setSelectedPhoto(null);
      setPreviewUrl(null);
    }
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPhoto || !caption.trim()) {
      return;
    }

    onSubmit({
      photo: selectedPhoto,
      caption: caption.trim(),
    });
  };

  const isSubmissionDisabled = !selectedPhoto || !caption.trim() || isSubmitting;
  const isExpired = new Date() >= new Date(prompt.weekEnd);

  if (isExpired) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Submission Window Closed</h3>
        <p className="text-gray-600">
          The submission period for this prompt has ended. Check back when the next prompt becomes available!
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Upload Your Photo
          </label>
          <PhotoUpload
            onPhotoSelected={handlePhotoSelected}
            onError={handleUploadError}
            selectedPhoto={selectedPhoto}
            previewUrl={previewUrl}
            disabled={isSubmitting}
          />
          {uploadError && (
            <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {uploadError}
            </div>
          )}
        </div>

        {/* Caption Input */}
        <div>
          <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
            Caption
          </label>
          <textarea
            id="caption"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
            placeholder="Share the story behind your photo..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={CONTENT_LIMITS.CAPTION_MAX_LENGTH}
            disabled={isSubmitting}
            required
          />
          <div className="mt-1 flex justify-between text-sm text-gray-500">
            <span>Tell us about your photo and why you chose it</span>
            <span>{caption.length}/{CONTENT_LIMITS.CAPTION_MAX_LENGTH}</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmissionDisabled}
            className="bg-primary-600 text-white px-8 py-3 rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Response'}
          </button>
        </div>
      </form>

    </>
  );
}