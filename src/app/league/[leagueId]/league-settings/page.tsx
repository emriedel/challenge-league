'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useLeague } from '@/hooks/useLeague';
import LeagueNavigation from '@/components/LeagueNavigation';
import { useMessages } from '@/hooks/useMessages';

interface Prompt {
  id: string;
  text: string;
  weekStart: string;
  weekEnd: string;
  voteStart: string;
  voteEnd: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'VOTING' | 'COMPLETED';
  queueOrder: number;
  createdAt: string;
}

interface PromptQueue {
  active: Prompt[];
  voting: Prompt[];
  scheduled: Prompt[];
  completed: Prompt[];
}

interface LeagueAdminPageProps {
  params: { leagueId: string };
}

export default function LeagueAdminPage({ params }: LeagueAdminPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: leagueData, isLoading: leagueLoading, error: leagueError } = useLeague(params.leagueId);
  const [queue, setQueue] = useState<PromptQueue>({ active: [], voting: [], scheduled: [], completed: [] });
  const [newPromptText, setNewPromptText] = useState('');
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addMessage, messages, clearMessage } = useMessages();
  const error = messages.admin;

  const fetchQueue = useCallback(async () => {
    if (!leagueData?.league.id) return;
    
    try {
      const response = await fetch(`/api/leagues/${params.leagueId}/admin/prompts`);
      if (response.ok) {
        const data = await response.json();
        setQueue(data.queue);
      }
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    }
  }, [params.leagueId, leagueData?.league.id]);

  useEffect(() => {
    if (status === 'loading' || leagueLoading) return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    if (leagueError) {
      router.push('/');
      return;
    }

    // Check if user is the league owner
    if (!leagueData?.league.isOwner) {
      router.push(`/league/${params.leagueId}`);
      return;
    }

    fetchQueue();
  }, [session, status, router, leagueData, leagueError, leagueLoading, params.leagueId, fetchQueue]);

  const createPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;

    setIsLoading(true);
    clearMessage('admin');

    try {
      const response = await fetch(`/api/leagues/${params.leagueId}/admin/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newPromptText.trim(),
        }),
      });

      if (response.ok) {
        setNewPromptText('');
        fetchQueue();
      } else {
        const data = await response.json();
        addMessage('admin', { type: 'error', text: data.error || 'Failed to create prompt' });
      }
    } catch (error) {
      addMessage('admin', { type: 'error', text: 'Failed to create prompt' });
    } finally {
      setIsLoading(false);
    }
  };

  const deletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const response = await fetch(`/api/leagues/${params.leagueId}/admin/prompts/${promptId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchQueue();
      } else {
        const data = await response.json();
        addMessage('admin', { type: 'error', text: data.error || 'Failed to delete prompt' });
      }
    } catch (error) {
      addMessage('admin', { type: 'error', text: 'Failed to delete prompt' });
    }
  };

  const startEditing = (prompt: Prompt) => {
    setEditingPrompt(prompt.id);
    setEditText(prompt.text);
  };

  const cancelEditing = () => {
    setEditingPrompt(null);
    setEditText('');
  };

  const saveEdit = async (promptId: string) => {
    if (!editText.trim()) return;

    try {
      const response = await fetch(`/api/leagues/${params.leagueId}/admin/prompts/${promptId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editText.trim(),
        }),
      });

      if (response.ok) {
        setEditingPrompt(null);
        setEditText('');
        fetchQueue();
      } else {
        const data = await response.json();
        addMessage('admin', { type: 'error', text: data.error || 'Failed to update prompt' });
      }
    } catch (error) {
      addMessage('admin', { type: 'error', text: 'Failed to update prompt' });
    }
  };

  const movePrompt = async (promptId: string, direction: 'up' | 'down') => {
    const currentIndex = queue.scheduled.findIndex(p => p.id === promptId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= queue.scheduled.length) return;

    const newOrder = [...queue.scheduled];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

    try {
      const response = await fetch(`/api/leagues/${params.leagueId}/admin/prompts/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptIds: newOrder.map(p => p.id),
        }),
      });

      if (response.ok) {
        fetchQueue();
      }
    } catch (error) {
      console.error('Failed to reorder prompts:', error);
    }
  };

  if (status === 'loading' || leagueLoading) {
    return (
      <div>
        <LeagueNavigation leagueId={params.leagueId} leagueName="Loading..." />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (leagueError) {
    return (
      <div>
        <LeagueNavigation leagueId={params.leagueId} leagueName="Error" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
            <p className="text-red-700">{leagueError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!leagueData?.league.isOwner) {
    return (
      <div>
        <LeagueNavigation leagueId={params.leagueId} leagueName={leagueData?.league.name || 'League'} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-yellow-900 mb-2">Access Denied</h3>
            <p className="text-yellow-700">Only league owners can access the admin panel.</p>
          </div>
        </div>
      </div>
    );
  }

  const league = leagueData.league;

  return (
    <div>
      <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">League Settings</h1>
          <p className="text-gray-600">Manage prompts for your league - they&rsquo;ll automatically activate in order</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error.text}
            <button onClick={() => clearMessage('admin')} className="float-right text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {/* Add New Prompt */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Future Prompt</h2>
          <form onSubmit={createPrompt}>
            <div className="mb-4">
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Share a photo that represents your favorite moment from this week"
                value={newPromptText}
                onChange={(e) => setNewPromptText(e.target.value)}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !newPromptText.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add to Queue'}
            </button>
          </form>
        </div>

        {/* Current Active Prompt */}
        {queue.active.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-green-900 mb-4">Currently Active</h2>
            {queue.active.map((prompt) => (
              <div key={prompt.id} className="bg-white rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{prompt.text}</h3>
                <div className="text-sm text-gray-600">
                  <p>Active until: {new Date(prompt.weekEnd).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scheduled Prompts Queue */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upcoming Queue ({queue.scheduled.length} prompts)
          </h2>
          
          {queue.scheduled.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No prompts in queue. Add some above!</p>
          ) : (
            <div className="space-y-3">
              {queue.scheduled.map((prompt, index) => (
                <div key={prompt.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                        {editingPrompt === prompt.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <textarea
                              rows={2}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                            />
                            <button
                              onClick={() => saveEdit(prompt.id)}
                              className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <h3 className="font-medium text-gray-900">{prompt.text}</h3>
                        )}
                      </div>
                    </div>
                    
                    {editingPrompt !== prompt.id && (
                      <div className="flex items-center gap-2">
                        {/* Move Up/Down */}
                        <button
                          onClick={() => movePrompt(prompt.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => movePrompt(prompt.id, 'down')}
                          disabled={index === queue.scheduled.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Move down"
                        >
                          ↓
                        </button>
                        
                        {/* Edit */}
                        <button
                          onClick={() => startEditing(prompt)}
                          className="text-blue-600 hover:text-blue-700 text-sm px-2 py-1"
                        >
                          Edit
                        </button>
                        
                        {/* Delete */}
                        <button
                          onClick={() => deletePrompt(prompt.id)}
                          className="text-red-600 hover:text-red-700 text-sm px-2 py-1"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Prompts */}
        {queue.completed.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Past Prompts ({queue.completed.length})
            </h2>
            <div className="space-y-2">
              {queue.completed.slice(-10).reverse().map((prompt) => (
                <div key={prompt.id} className="text-sm text-gray-600">
                  {prompt.text} - {new Date(prompt.createdAt).toLocaleDateString()}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          <p><strong>How it works:</strong> Prompts automatically activate in queue order every Saturday at 12 PM PT. The next prompt will become active when the current one ends.</p>
        </div>
      </div>
    </div>
  );
}