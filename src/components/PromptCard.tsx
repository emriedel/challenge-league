'use client';

import CountdownTimer from './CountdownTimer';

interface PromptCardProps {
  prompt: {
    id: string;
    text: string;
    weekStart: string;
    weekEnd: string;
  };
  userResponse?: {
    id: string;
    submittedAt: string;
  } | null;
  showSubmitButton?: boolean;
  onSubmitClick?: () => void;
}

export default function PromptCard({ 
  prompt, 
  userResponse, 
  showSubmitButton = false,
  onSubmitClick 
}: PromptCardProps) {
  const hasSubmitted = !!userResponse;
  const isExpired = new Date() >= new Date(prompt.weekEnd);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          This Week&apos;s Prompt
        </h2>
        <div className="bg-primary-50 p-4 rounded-lg border-l-4 border-primary-500">
          <p className="text-primary-800 font-medium text-lg">
            &quot;{prompt.text}&quot;
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <CountdownTimer weekEnd={prompt.weekEnd} />
        
        {hasSubmitted ? (
          <div className="flex items-center text-green-600">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Submitted</span>
          </div>
        ) : isExpired ? (
          <div className="text-gray-500 font-medium">
            Submission period ended
          </div>
        ) : showSubmitButton ? (
          <button
            onClick={onSubmitClick}
            className="bg-primary-600 text-white px-6 py-2 rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Submit Response
          </button>
        ) : null}
      </div>

      {hasSubmitted && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-green-800 text-sm">
            <strong>Submitted:</strong> {new Date(userResponse.submittedAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
          <p className="text-green-700 text-sm mt-1">
            Your response will be published when the submission window closes.
          </p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>
          <strong>Submission window:</strong> {' '}
          {new Date(prompt.weekStart).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })} - {' '}
          {new Date(prompt.weekEnd).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}