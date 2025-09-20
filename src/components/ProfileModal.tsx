'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import ProfileAvatar from '@/components/ProfileAvatar';
import NotificationSettings from '@/components/NotificationSettings';
import { useMessages } from '@/hooks/useMessages';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { data: session, update } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const { addMessage, messages } = useMessages();
  const message = messages.profile;

  // Close modal on ESC key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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

      // Update the session with the new photo
      await update({
        ...session,
        user: {
          ...session?.user,
          image: photoUrl,
        },
      });

      addMessage('profile', { type: 'success', text: 'Profile photo updated successfully!' });
    } catch (error: any) {
      console.error('Error updating profile photo:', error);
      addMessage('profile', { type: 'error', text: error.message || 'Failed to update profile photo' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/app/auth/signin' });
  };

  if (!session) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-app-surface shadow-xl z-[60] transform transition-all duration-300 ease-out flex flex-col ${
        isOpen 
          ? 'translate-x-0 scale-100 opacity-100' 
          : 'translate-x-full scale-95 opacity-0'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between pl-6 pr-4 h-16 border-b border-app-border bg-app-bg flex-shrink-0">
          <h2 className="text-xl font-semibold text-white">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          
          {/* Message Display */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-app-success-bg border-app-success text-app-success' 
                : 'bg-app-error-bg border-app-error text-app-error'
            }`}>
              {message.text}
            </div>
          )}

          {/* Profile Photo Section */}
          <div className="bg-app-surface-dark rounded-lg p-6 mb-6 shadow-sm border border-app-border">
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <ProfileAvatar 
                  username={session.user.username || session.user.email || 'User'}
                  profilePhoto={session.user.profilePhoto}
                  size="xl"
                  className="mx-auto"
                />
                
                {/* Edit Photo Button */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                  id="profile-photo-input"
                />
                <button
                  onClick={() => document.getElementById('profile-photo-input')?.click()}
                  disabled={isUploading}
                  className="absolute -bottom-2 -right-2 rounded-full shadow-lg transition-colors disabled:opacity-50 bg-[#3a8e8c] text-white hover:bg-[#2f7371] w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] flex items-center justify-center p-0"
                >
                  {isUploading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* User Info */}
          <div className="bg-app-surface-dark rounded-lg p-6 mb-6 shadow-sm border border-app-border">
            <h3 className="text-lg font-semibold text-app-text mb-4">Account Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-app-text-muted mb-1">Username</label>
                <p className="text-app-text font-medium">@{session.user.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-muted mb-1">Email</label>
                <p className="text-app-text">{session.user.email}</p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="mb-6">
            <NotificationSettings />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center px-4 py-3 bg-[#8b4444] text-white rounded-lg hover:bg-[#7a3d3d] focus:outline-none focus:ring-2 focus:ring-[#8b4444] focus:ring-offset-2 transition-colors font-medium shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}