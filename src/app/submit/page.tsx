'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePrompt } from '@/hooks/usePrompt';
import PromptCard from '@/components/PromptCard';
import SubmissionForm from '@/components/SubmissionForm';

export default function Submit() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: promptData, isLoading, error, refetch } = usePrompt();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  const handleSubmission = async (data: { photo: File; caption: string }) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // First upload the photo
      const formData = new FormData();
      formData.append('file', data.photo);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json();
        throw new Error(uploadError.error || 'Failed to upload photo');
      }

      const { url: photoUrl } = await uploadResponse.json();

      // Then submit the response
      const submitResponse = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId: promptData?.prompt.id,
          photoUrl,
          caption: data.caption,
        }),
      });

      if (!submitResponse.ok) {
        const submitError = await submitResponse.json();
        throw new Error(submitError.error || 'Failed to submit response');
      }

      // Success! Refresh the prompt data to show the submitted state
      await refetch();
      
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'An error occurred while submitting');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!promptData) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Prompt</h3>
          <p className="text-gray-600">There is no active prompt at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit</h1>
        <p className="text-gray-600">
          Respond to this week&apos;s prompt
        </p>
      </div>
      
      <div className="mb-6">
        <PromptCard 
          prompt={promptData.prompt}
          userResponse={promptData.userResponse}
          showSubmitButton={false}
          onSubmitClick={() => {}}
        />
      </div>
      
      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {submitError}
        </div>
      )}
      
      {promptData.userResponse ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-green-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-green-900 mb-2">Response Submitted!</h3>
          <p className="text-green-700 mb-4">
            Your photo and caption have been submitted successfully.
          </p>
          <p className="text-sm text-green-600">
            Your response will be published with everyone else&apos;s when the submission window closes.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <SubmissionForm
            prompt={promptData.prompt}
            onSubmit={handleSubmission}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
}