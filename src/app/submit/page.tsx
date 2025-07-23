'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePrompt } from '@/hooks/usePrompt';
import PromptCard from '@/components/PromptCard';

export default function Submit() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: promptData, isLoading, error } = usePrompt();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  const handleSubmitClick = () => {
    // TODO: Open submission modal/form
    console.log('Submit clicked - will implement submission form');
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
          showSubmitButton={!promptData.userResponse}
          onSubmitClick={handleSubmitClick}
        />
      </div>
      
      {!promptData.userResponse && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Submit Your Response</h3>
            <p className="text-gray-500 mb-4">
              Upload a photo and add your caption to respond to this week&apos;s prompt.
            </p>
            <p className="text-sm text-gray-400">
              Note: Photo upload functionality will be implemented in the next step.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}