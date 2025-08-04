'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfileAvatar from '@/components/ProfileAvatar';
import { useMessages } from '@/hooks/useMessages';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { addMessage, messages } = useMessages();
  const message = messages.profile;

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  const handlePhotoUpload = async (file: File) => {
    setIsUploading(true);

    try {
      // First upload the file using the main upload endpoint
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload photo');
      }

      const { url: photoUrl } = await uploadResponse.json();

      // Then update the user's profile photo URL
      const updateResponse = await fetch('/api/profile/photo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoUrl }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update profile photo');
      }

      addMessage('profile', { type: 'success', text: 'Profile photo updated successfully!' });
      setIsEditingPhoto(false);
      
      // Update the session to reflect the new profile photo
      await update();
    } catch (error) {
      console.error('Photo upload error:', error);
      addMessage('profile', { 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to upload photo' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoDelete = async () => {
    setIsUploading(true);

    try {
      const deleteResponse = await fetch('/api/profile/photo', {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.error || 'Failed to delete photo');
      }

      addMessage('profile', { type: 'success', text: 'Profile photo removed successfully!' });
      setIsEditingPhoto(false);
      
      // Update the session to reflect the removed profile photo
      await update();
    } catch (error) {
      console.error('Photo delete error:', error);
      addMessage('profile', { 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to delete photo' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            {/* Profile Photo Section */}
            <div className="relative inline-block mb-6">
              <ProfileAvatar 
                username={session.user.username || session.user.email || 'User'}
                profilePhoto={session.user.profilePhoto}
                size="xl"
              />
              
              {/* Edit button overlay */}
              <button
                onClick={() => setIsEditingPhoto(true)}
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg"
                title="Edit profile photo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">@{session.user.username}</h1>
            <p className="text-gray-600">{session.user.email}</p>
          </div>

          {/* Profile Photo Editing Modal */}
          {isEditingPhoto && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Update Profile Photo</h3>
                  <button
                    onClick={() => setIsEditingPhoto(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="text-center mb-6">
                  <ProfileAvatar 
                    username={session.user.username || session.user.email || 'User'}
                    profilePhoto={session.user.profilePhoto}
                    size="lg"
                  />
                </div>

                <div className="space-y-4">
                  {/* Upload new photo */}
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handlePhotoUpload(file);
                        }
                      }}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <div className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer text-center disabled:opacity-50">
                      {isUploading ? 'Uploading...' : 'Upload New Photo'}
                    </div>
                  </label>

                  {/* Remove photo button (only show if user has a photo) */}
                  {session.user.profilePhoto && (
                    <button
                      onClick={handlePhotoDelete}
                      disabled={isUploading}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? 'Removing...' : 'Remove Photo'}
                    </button>
                  )}

                  <button
                    onClick={() => setIsEditingPhoto(false)}
                    disabled={isUploading}
                    className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success/Error Messages */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <span className="text-gray-900">@{session.user.username}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <span className="text-gray-900">{session.user.email}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 text-sm">
                <strong>Note:</strong> Username and email changes are not currently available. 
                Contact support if you need to update this information.
              </p>
            </div>
          </div>
        </div>
    </div>
  );
}