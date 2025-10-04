'use client';

import { useState, useCallback } from 'react';
import type { UseSubmissionManagementReturn, Message } from '@/types/hooks';
import { useCacheInvalidator } from '@/lib/cacheInvalidation';
import { compressImage } from '@/lib/imageCompression';

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
  onSuccess?: (message: Message) => void;
  onError?: (message: string) => void;
  onRefetch?: () => void;
}

export function useSubmissionManagement({
  promptId,
  leagueId,
  onSuccess,
  onError,
  onRefetch
}: UseSubmissionManagementProps): UseSubmissionManagementReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cacheInvalidator = useCacheInvalidator();

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

      // Success handled by UI state change - no banner needed
      onRefetch?.(); // Refresh to show updated submission
      await cacheInvalidator.handleSubmission('submit', leagueId);
    } catch (error) {
      console.error('Submission error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  }, [promptId, leagueId, onError, onRefetch, cacheInvalidator]);

  const updateResponse = useCallback(async (data: UpdateData, currentImageUrl: string) => {
    if (!promptId) return;

    setIsSubmitting(true);

    try {
      let photoUrl = currentImageUrl; // Keep existing photo by default

      // Upload new photo if one was selected
      if (data.photo) {
        // Compress the image before upload
        const compressedFile = await compressImage(data.photo, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
          maxSizeBytes: 1 * 1024 * 1024, // 1MB target
        });

        const formData = new FormData();
        formData.append('file', compressedFile);

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

      // Success handled by UI state change - no banner needed
      onRefetch?.(); // Refresh to show updated submission
      await cacheInvalidator.handleSubmission('update', leagueId);
    } catch (error) {
      console.error('Update error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to update submission');
    } finally {
      setIsSubmitting(false);
    }
  }, [promptId, leagueId, onError, onRefetch, cacheInvalidator]);

  return {
    isSubmitting,
    submitResponse,
    updateResponse,
  };
}