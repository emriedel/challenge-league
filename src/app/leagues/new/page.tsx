'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';
import { useMessages } from '@/hooks/useMessages';
import { CONTENT_LIMITS, UI_TIMEOUTS } from '@/constants/app';

export default function CreateLeaguePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addMessage, messages } = useMessages();
  const message = messages.creation;

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

      // Show success message and redirect to the newly created league
      addMessage('creation', { type: 'success', text: 'League created successfully!' });
      setTimeout(() => {
        router.push(`/league/${data.league.id}`);
      }, UI_TIMEOUTS.REDIRECT_DELAY_MS);
    } catch (err) {
      addMessage('creation', { type: 'error', text: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col px-4 pt-8 sm:py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">

        {/* Create League Card */}
        <div className="bg-app-surface py-6 sm:py-8 px-6 shadow-xl rounded-xl border border-app-border">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-app-text text-center mb-2">
              Create New League
            </h2>
            <p className="text-app-text-secondary text-sm text-center">
              Start your own competition
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-app-text-secondary mb-1.5">
                League Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="appearance-none block w-full px-4 py-2.5 sm:py-3 border border-app-border-light bg-app-surface-dark text-app-text rounded-xl shadow-sm placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter a unique name for your league"
                required
                minLength={3}
                maxLength={CONTENT_LIMITS.LEAGUE_NAME_MAX_LENGTH}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-app-text-secondary mb-1.5">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="appearance-none block w-full px-4 py-2.5 sm:py-3 border border-app-border-light bg-app-surface-dark text-app-text rounded-xl shadow-sm placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Describe your league's purpose or theme..."
                maxLength={CONTENT_LIMITS.LEAGUE_DESCRIPTION_MAX_LENGTH}
              />
            </div>

            {message && (
              <div className={`rounded-lg p-4 ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                  : 'bg-app-error-bg border border-app-error text-app-error'
              }`}>
                <div className="text-sm">
                  {message.text}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
              >
                {isSubmitting ? 'Creating...' : 'Create League'}
              </button>
              
              <Link
                href="/"
                className="w-full flex justify-center py-2.5 sm:py-3 px-4 text-app-text-secondary bg-app-surface-dark rounded-xl hover:bg-app-surface-light transition-all duration-200 font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-app-border">
            <div className="text-xs text-app-text-muted space-y-1 text-center">
              <p>• You'll get a unique invite code to share</p>
              <p>• Create challenges and manage competitions</p>
              <p>• Full administrative control</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}