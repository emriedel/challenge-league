'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';
import { useCreateLeagueMutation } from '@/hooks/queries/useLeagueQuery';

export default function NewLeaguePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Use the mutation hook for proper cache invalidation
  const createMutation = useCreateLeagueMutation();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/app/auth/signin');
    }
  }, [session, status, router]);

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    setError('');

    try {
      const data = await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim()
      });

      // Redirect to the new league
      router.push(`/app/league/${data.league.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

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

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-app-bg flex flex-col px-4 pt-8 sm:py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-app-text mb-2">
            Create New League
          </h1>
        </div>

        {/* Create Form */}
        <div className="bg-app-surface py-8 px-6 shadow-xl rounded-xl border border-app-border">
          <form onSubmit={handleCreateLeague} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-app-text-secondary mb-2">
                League Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="league-name-input"
                className="w-full px-3 py-2 bg-app-surface-dark border border-app-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-app-text placeholder-app-text-muted"
                placeholder="Enter league name"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-app-text-secondary mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="league-description-input"
                className="w-full px-3 py-2 bg-app-surface-dark border border-app-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-app-text placeholder-app-text-muted resize-none"
                placeholder="Describe your league and what makes it special"
                required
              />
            </div>

            {error && (
              <div className="bg-app-error-bg border border-app-error text-app-error px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                disabled={createMutation.isPending || !name.trim() || !description.trim()}
                data-testid="create-league-button"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-[#3a8e8c] hover:bg-[#347a78] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3a8e8c] transition-all duration-200 font-semibold disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create League'}
              </button>
              
              <Link
                href="/app"
                className="w-full flex justify-center py-3 px-4 text-app-text-secondary bg-app-surface-dark rounded-xl hover:bg-app-surface-light transition-all duration-200 font-medium"
              >
                Back to Leagues
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}