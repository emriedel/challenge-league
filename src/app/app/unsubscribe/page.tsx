'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || null;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid unsubscribe link. Please use the link from your email.');
        return;
      }

      try {
        const response = await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to unsubscribe');
        }

        setStatus('success');
        setMessage('You have been successfully unsubscribed from all email notifications.');
      } catch (error: any) {
        console.error('Error unsubscribing:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to unsubscribe. Please try again or contact support.');
      }
    };

    unsubscribe();
  }, [token]);

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-app-surface border border-app-border rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-app-text mb-4">Unsubscribe from Emails</h1>

        {status === 'loading' && (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-app-border border-t-[#3a8e8c] rounded-full animate-spin" />
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6">
              <svg className="w-16 h-16 text-app-success mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-app-text-secondary mb-4">{message}</p>
              <p className="text-app-text-muted text-sm">
                You can re-enable email notifications anytime by signing in and updating your profile settings.
              </p>
            </div>
            <Link
              href="https://challenge-league.app"
              className="inline-block px-6 py-3 bg-[#3a8e8c] text-white rounded-lg hover:bg-[#2f7371] transition-colors font-medium"
            >
              Visit Challenge League
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6">
              <svg className="w-16 h-16 text-app-error mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-app-text-secondary mb-4">{message}</p>
            </div>
            <Link
              href="https://challenge-league.app"
              className="inline-block px-6 py-3 bg-[#3a8e8c] text-white rounded-lg hover:bg-[#2f7371] transition-colors font-medium"
            >
              Visit Challenge League
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-app-border border-t-[#3a8e8c] rounded-full animate-spin" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
