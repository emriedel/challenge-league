'use client';

import { useState, useCallback } from 'react';

interface SubmissionData {
  photo: File;
  caption: string;
}

interface UpdateData {
  photo?: File;
  caption: string;
}

interface UseSubmissionManagementProps {
  promptId?: string;
  leagueId: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onRefetch?: () => void;
}

export function useSubmissionManagement({
  promptId,
  leagueId,
  onSuccess,
  onError,
  onRefetch
}: UseSubmissionManagementProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitResponse = useCallback(async (data: SubmissionData) => {
    if (!promptId) return;

    setIsSubmitting(true);

    try {
      // First upload the photo
      const formData = new FormData();
      formData.append('file', data.photo);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload photo');
      }

      const { url: photoUrl } = await uploadResponse.json();

      // Then submit the response
      const submitResponse = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId,
          photoUrl,
          caption: data.caption,
          leagueId,
        }),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || 'Failed to submit response');
      }

      onSuccess?.('Response submitted successfully!');
      onRefetch?.(); // Refresh to show updated submission
    } catch (error) {
      console.error('Submission error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  }, [promptId, leagueId, onSuccess, onError, onRefetch]);

  const updateResponse = useCallback(async (data: UpdateData, currentImageUrl: string) => {
    if (!promptId) return;

    setIsSubmitting(true);

    try {
      let photoUrl = currentImageUrl; // Keep existing photo by default

      // Upload new photo if one was selected
      if (data.photo) {
        const formData = new FormData();
        formData.append('file', data.photo);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload photo');
        }

        const { url } = await uploadResponse.json();
        photoUrl = url;
      }

      // Update the response
      const submitResponse = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId,
          photoUrl,
          caption: data.caption,
          leagueId,
        }),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || 'Failed to update submission');
      }

      onSuccess?.('Submission updated successfully!');
      onRefetch?.(); // Refresh to show updated submission
    } catch (error) {
      console.error('Update error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to update submission');
    } finally {
      setIsSubmitting(false);
    }
  }, [promptId, leagueId, onSuccess, onError, onRefetch]);

  return {
    isSubmitting,
    submitResponse,
    updateResponse,
  };
}