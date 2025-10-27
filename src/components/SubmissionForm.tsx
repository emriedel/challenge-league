'use client';

import { useState, useMemo, useCallback } from 'react';
import PhotoUpload from './PhotoUpload';
import { CONTENT_LIMITS } from '@/constants/app';
import type { SubmissionFormProps } from '@/types/components';
import { isSubmissionWindowOpen } from '@/lib/phaseCalculations';


export default function SubmissionForm({ prompt, onSubmit, isSubmitting = false }: SubmissionFormProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photoAgeWarning, setPhotoAgeWarning] = useState<string | null>(null);

  // Memoize callbacks to prevent PhotoUpload from re-rendering
  const handlePhotoSelected = useCallback((file: File | null, preview: string) => {
    if (file && preview) {
      setSelectedPhoto(file);
      setPreviewUrl(preview);
      setUploadError(null); // Clear any previous upload errors
    } else {
      setSelectedPhoto(null);
      setPreviewUrl(null);
    }
  }, []);

  const handleUploadError = useCallback((error: string) => {
    setUploadError(error);
  }, []);

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

  // Memoize challenge start date to prevent new Date creation on every render
  const challengeStartDate = useMemo(
    () => prompt.phaseStartedAt ? new Date(prompt.phaseStartedAt) : null,
    [prompt.phaseStartedAt]
  );

  const promptForTimer = useMemo(() => ({
    id: prompt.id,
    status: prompt.status,
    phaseStartedAt: challengeStartDate,
  }), [prompt.id, prompt.status, challengeStartDate]);

  const isWindowClosed = !isSubmissionWindowOpen(promptForTimer);
  const isSubmissionDisabled = !selectedPhoto || !caption.trim() || isSubmitting || isWindowClosed;


  if (isWindowClosed) {
    return (
      <div className="bg-app-surface-dark border border-app-border rounded-lg p-8 text-center">
        <div className="text-app-text-muted mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-app-text mb-2">Submission Window Closed</h3>
        <p className="text-app-text-secondary">
          The submission period for this prompt has ended. Check back when the next prompt becomes available!
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* Photo Upload */}
        <div>
          <PhotoUpload
            onPhotoSelected={handlePhotoSelected}
            onError={handleUploadError}
            selectedPhoto={selectedPhoto}
            previewUrl={previewUrl}
            disabled={isSubmitting}
            challengeStartDate={challengeStartDate}
            onPhotoAgeWarning={setPhotoAgeWarning}
          />
          {uploadError && (
            <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {uploadError}
            </div>
          )}
          {photoAgeWarning && (
            <div className="mt-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{photoAgeWarning}</span>
            </div>
          )}
        </div>

        {/* Caption Input - Only show when photo is selected */}
        {selectedPhoto && (
          <div className="mt-4">
            <textarea
              id="caption"
              rows={4}
              className="w-full px-3 py-2 border border-app-border bg-app-surface-dark text-app-text rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 disabled:bg-app-surface-light disabled:cursor-not-allowed text-base"
              placeholder="Share the story behind your photo..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={CONTENT_LIMITS.CAPTION_MAX_LENGTH}
              disabled={isSubmitting}
            />
            {caption.length >= 400 && (
              <div className="mt-1 text-right text-sm text-app-text-muted">
                <span>{caption.length}/{CONTENT_LIMITS.CAPTION_MAX_LENGTH}</span>
              </div>
            )}
          </div>
        )}

        {/* Submit Button - Only show when photo is selected */}
        {selectedPhoto && (
          <>
            <div className="flex justify-center mt-2">
              <button
                type="submit"
                disabled={isSubmissionDisabled}
                className={`px-16 py-3 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed transition-colors min-w-[200px] ${
                  isSubmissionDisabled
                    ? 'bg-gray-800 text-gray-400 opacity-50'
                    : 'bg-[#3a8e8c] text-white hover:bg-[#2f7574] focus:ring-[#3a8e8c]'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
            {/* Horizontal rule for visual separation */}
            <div className="border-t border-app-border mt-6"></div>
          </>
        )}
      </form>

    </>
  );
}