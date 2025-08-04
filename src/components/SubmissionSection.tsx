'use client';

import SubmissionForm from './SubmissionForm';
import type { SubmissionSectionProps } from '@/types/components';


export default function SubmissionSection({ 
  prompt, 
  onSubmit, 
  isSubmitting, 
  message 
}: SubmissionSectionProps) {
  return (
    <div className="space-y-6 mb-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Current Challenge</h2>
        <p className="text-gray-600 mb-6">{prompt.text}</p>
        
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        
        <SubmissionForm
          prompt={prompt}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}