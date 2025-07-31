'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinLeaguePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{
    league: {
      name: string;
      slug: string;
      memberCount: number;
      owner: { username: string };
    };
  } | null>(null);

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-center">
            <div className="text-green-600 text-4xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-green-900 mb-4">
              Welcome to {success.league.name}!
            </h1>
            <p className="text-green-700 mb-6">
              You&rsquo;ve successfully joined the league. You can now participate in challenges and compete with other members.
            </p>

            <div className="bg-white border border-green-200 rounded-md p-4 mb-6">
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>League:</strong> {success.league.name}</p>
                <p><strong>Owner:</strong> @{success.league.owner.username}</p>
                <p><strong>Members:</strong> {success.league.memberCount}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href={`/league/${success.league.id}`}
                className="block w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 text-center"
              >
                Go to League Dashboard
              </Link>
              <Link
                href="/"
                className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Join a League
        </h1>

        <p className="text-gray-600 mb-6">
          Enter an invite code to join an existing league. League owners can share their invite codes with friends and family.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
              Invite Code *
            </label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg tracking-wider"
              placeholder="Enter 6-character invite code"
              required
              minLength={6}
              maxLength={6}
              style={{ textTransform: 'uppercase' }}
            />
            <p className="text-sm text-gray-500 mt-1">
              Invite codes are 6 characters long and case-insensitive (e.g., ABC123)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || inviteCode.trim().length !== 6}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Joining...' : 'Join League'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Don&rsquo;t have an invite code?
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>Ask a league owner to share their invite code with you, or:</p>
            <Link
              href="/leagues/new"
              className="inline-block text-blue-600 hover:text-blue-800 font-medium"
            >
              Create your own league →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}