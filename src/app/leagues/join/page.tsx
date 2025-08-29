'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';
import type { League } from '@/types/league';
import { CONTENT_LIMITS } from '@/constants/app';

export default function JoinLeaguePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{
    league: League;
  } | null>(null);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-app-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteCode: inviteCode.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join league');
      }

      setSuccess(data);
      setInviteCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col px-4 pt-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">

          {/* Success Card */}
          <div className="bg-app-surface py-6 sm:py-8 px-6 shadow-xl rounded-xl border border-app-border">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-app-text mb-2">
                Welcome to {success.league.name}!
              </h2>
              <p className="text-app-text-secondary text-sm mb-6">
                You can now participate in challenges and compete with other members
              </p>

              <div className="bg-app-surface-dark rounded-xl p-4 mb-6 text-left">
                <div className="text-sm text-app-text-secondary space-y-1">
                  <p><span className="text-app-text font-medium">League:</span> {success.league.name}</p>
                  <p><span className="text-app-text font-medium">Owner:</span> @{success.league.owner?.username || 'Unknown'}</p>
                  <p><span className="text-app-text font-medium">Members:</span> {success.league.memberCount}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href={`/league/${success.league.id}`}
                  className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 font-semibold"
                >
                  Go to League Dashboard
                </Link>
                <Link
                  href="/"
                  className="w-full flex justify-center py-2.5 sm:py-3 px-4 text-app-text-secondary bg-app-surface-dark rounded-xl hover:bg-app-surface-light transition-all duration-200 font-medium"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg flex flex-col px-4 pt-8 sm:py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">

        {/* Join League Card */}
        <div className="bg-app-surface py-6 sm:py-8 px-6 shadow-xl rounded-xl border border-app-border">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-app-text text-center mb-2">
              Join a League
            </h2>
            <p className="text-app-text-secondary text-sm text-center">
              Enter an invite code to join friends
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-app-text-secondary mb-1.5">
                Invite Code
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="appearance-none block w-full px-4 py-2.5 sm:py-3 border border-app-border-light bg-app-surface-dark text-app-text rounded-xl shadow-sm placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-lg tracking-wider"
                placeholder={`Enter ${CONTENT_LIMITS.INVITE_CODE_LENGTH}-character code`}
                required
                minLength={CONTENT_LIMITS.INVITE_CODE_LENGTH}
                maxLength={CONTENT_LIMITS.INVITE_CODE_LENGTH}
                style={{ textTransform: 'uppercase' }}
              />
              <p className="text-xs text-app-text-muted mt-1">
                6 characters long (e.g., ABC123)
              </p>
            </div>

            {error && (
              <div className="bg-app-error-bg border border-app-error text-app-error px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting || inviteCode.trim().length !== 6}
                className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
              >
                {isSubmitting ? 'Joining...' : 'Join League'}
              </button>
              
              <Link
                href="/"
                className="w-full flex justify-center py-2.5 sm:py-3 px-4 text-app-text-secondary bg-app-surface-dark rounded-xl hover:bg-app-surface-light transition-all duration-200 font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-app-border text-center">
            <p className="text-sm text-app-text-secondary mb-2">
              Don't have an invite code?
            </p>
            <Link
              href="/leagues/new"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors"
            >
              Create your own league →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}