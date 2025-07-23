'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useGallery } from '@/hooks/useGallery';
import ResponseCard from '@/components/ResponseCard';

export default function Gallery() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: galleryData, isLoading, error } = useGallery();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const hasResponses = galleryData?.responses && galleryData.responses.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gallery</h1>
        {galleryData?.prompt ? (
          <div className="space-y-2">
            <p className="text-gray-600">
              Responses from your friends to the prompt:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-gray-900 font-medium">
                &quot;{galleryData.prompt.text}&quot;
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Week of {new Date(galleryData.prompt.weekStart).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">
            View responses from your friends to completed prompts
          </p>
        )}
      </div>

      {/* Content */}
      {!hasResponses ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
          <p className="text-gray-500 mb-4">
            The gallery will show your friends&apos; responses once a submission window closes and responses are published.
          </p>
          <p className="text-sm text-gray-400">
            Check back after the current prompt period ends to see published responses!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Response Count */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              {galleryData.responses.length} response{galleryData.responses.length !== 1 ? 's' : ''} from your friends
            </p>
          </div>

          {/* Responses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {galleryData.responses.map((response) => (
              <ResponseCard key={response.id} response={response} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}