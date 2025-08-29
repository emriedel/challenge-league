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
      <div className="bg-app-surface border border-app-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2 text-app-text">Your Submission</h2>
        
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-app-success-bg border border-app-success text-app-success' 
              : 'bg-app-error-bg border border-app-error text-app-error'
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