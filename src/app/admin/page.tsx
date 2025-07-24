'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Prompt {
  id: string;
  text: string;
  weekStart: string;
  weekEnd: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED';
  queueOrder: number;
  createdAt: string;
}

interface PromptQueue {
  active: Prompt[];
  scheduled: Prompt[];
  completed: Prompt[];
}

export default function Admin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [queue, setQueue] = useState<PromptQueue>({ active: [], scheduled: [], completed: [] });
  const [newPromptText, setNewPromptText] = useState('');
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    // Simple admin check - in production you'd have proper role-based auth
    if (session.user.username !== 'testuser1') {
      router.push('/');
      return;
    }

    fetchQueue();
  }, [session, status, router]);

  const fetchQueue = async () => {
    try {
      const response = await fetch('/api/admin/prompts');
      if (response.ok) {
        const data = await response.json();
        setQueue(data.queue);
      }
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    }
  };

  const createPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/prompts', {
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
        setError(data.error || 'Failed to create prompt');
      }
    } catch (error) {
      setError('Failed to create prompt');
    } finally {
      setIsLoading(false);
    }
  };

  const deletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const response = await fetch(`/api/admin/prompts/${promptId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchQueue();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete prompt');
      }
    } catch (error) {
      setError('Failed to delete prompt');
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
      const response = await fetch(`/api/admin/prompts/${promptId}`, {
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
        setError(data.error || 'Failed to update prompt');
      }
    } catch (error) {
      setError('Failed to update prompt');
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
      const response = await fetch('/api/admin/prompts/reorder', {
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

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.username !== 'testuser1') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Prompt Queue Manager</h1>
        <p className="text-gray-600">Manage future prompts - they&apos;ll automatically activate in order</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button onClick={() => setError(null)} className="float-right text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Add New Prompt */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Future Prompt</h2>
        <form onSubmit={createPrompt}>
          <div className="mb-4">
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Share a photo that represents your favorite moment from this week"
              value={newPromptText}
              onChange={(e) => setNewPromptText(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !newPromptText.trim()}
            className="bg-primary-600 text-white px-6 py-2 rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add to Queue'}
          </button>
        </form>
      </div>

      {/* Current Active Prompt */}
      {queue.active.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-green-900 mb-4">📍 Currently Active</h2>
          {queue.active.map((prompt) => (
            <div key={prompt.id} className="bg-white rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">&quot;{prompt.text}&quot;</h3>
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
          📅 Upcoming Queue ({queue.scheduled.length} prompts)
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
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                        <h3 className="font-medium text-gray-900">&quot;{prompt.text}&quot;</h3>
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
            📚 Past Prompts ({queue.completed.length})
          </h2>
          <div className="space-y-2">
            {queue.completed.slice(-10).reverse().map((prompt) => (
              <div key={prompt.id} className="text-sm text-gray-600">
&quot;{prompt.text}&quot; - {new Date(prompt.createdAt).toLocaleDateString()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue Processing */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          🔄 Queue Processing
        </h2>
        <p className="text-blue-700 mb-4">
          Manually trigger the automatic prompt cycle processing. This will:
        </p>
        <ul className="text-sm text-blue-600 mb-4 space-y-1">
          <li>• Complete expired prompts and publish responses</li>
          <li>• Activate the next scheduled prompt</li>
          <li>• Clean up old photos from completed prompts</li>
        </ul>
        <button
          onClick={async () => {
            setIsLoading(true);
            try {
              const response = await fetch('/api/admin/process-queue', {
                method: 'POST',
              });
              const result = await response.json();
              
              if (result.success) {
                alert('Queue processed successfully! Check the console for details.');
                fetchQueue(); // Refresh the queue display
              } else {
                alert(`Error: ${result.error}`);
              }
            } catch (error) {
              alert('Failed to process queue');
              console.error('Queue processing error:', error);
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Process Queue Now'}
        </button>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p><strong>How it works:</strong> Prompts automatically activate in queue order every Saturday at 12 PM PT. The next prompt will become active when the current one ends.</p>
      </div>
    </div>
  );
}