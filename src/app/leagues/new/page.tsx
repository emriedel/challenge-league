'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateLeaguePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create league');
      }

      // Redirect to the newly created league
      router.push(`/league/${data.league.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Create New League
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              League Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter a unique name for your league"
              required
              minLength={3}
              maxLength={50}
            />
            <p className="text-sm text-gray-500 mt-1">
              3-50 characters. This will be used to generate a unique URL for your league.
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your league's purpose, theme, or rules..."
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional. Up to 500 characters to help others understand what your league is about.
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
              disabled={isSubmitting || !name.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create League'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            What happens after creating a league?
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• You'll become the league owner with full administrative privileges</p>
            <p>• You'll receive a unique invite code to share with friends</p>
            <p>• You can create challenges and manage the competition schedule</p>
            <p>• Only league members can see and participate in your challenges</p>
          </div>
        </div>
      </div>
    </div>
  );
}