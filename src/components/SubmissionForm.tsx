'use client';

import { useState } from 'react';
import PhotoUpload from './PhotoUpload';

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
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handlePhotoSelected = (file: File | null, preview: string) => {
    if (file && preview) {
      setSelectedPhoto(file);
      setPreviewUrl(preview);
    } else {
      setSelectedPhoto(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPhoto || !caption.trim()) {
      return;
    }

    setShowConfirmation(true);
  };

  const confirmSubmission = () => {
    if (selectedPhoto && caption.trim()) {
      onSubmit({
        photo: selectedPhoto,
        caption: caption.trim(),
      });
      setShowConfirmation(false);
    }
  };

  const cancelSubmission = () => {
    setShowConfirmation(false);
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
            selectedPhoto={selectedPhoto}
            previewUrl={previewUrl}
            disabled={isSubmitting}
          />
        </div>

        {/* Caption Input */}
        <div>
          <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
            Caption
          </label>
          <textarea
            id="caption"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Share the story behind your photo..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={500}
            disabled={isSubmitting}
            required
          />
          <div className="mt-1 flex justify-between text-sm text-gray-500">
            <span>Tell us about your photo and why you chose it</span>
            <span>{caption.length}/500</span>
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

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Your Submission
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                <strong>Prompt:</strong> &quot;{prompt.text}&quot;
              </p>
              
              {previewUrl && (
                <div className="mb-3">
                  <img
                    src={previewUrl}
                    alt="Your submission"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Caption:</strong> {caption}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Once submitted, you cannot edit or change your response. 
                Your photo and caption will be published when the submission window closes.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelSubmission}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmission}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}