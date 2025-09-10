'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';

export default function ProfileSetup() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Handle authentication redirect
  useEffect(() => {
    if (session === null) {
      // Not authenticated, redirect to sign in
      router.push('/app/auth/signin');
    } else if (session) {
      // Authenticated, page can load
      setIsLoading(false);
    }
    // If session is undefined (loading), keep showing loading state
  }, [session, router]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const uploadPhoto = async () => {
    if (!profilePhoto) return null;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', profilePhoto);

      const response = await fetch('/api/profile/photo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      // Update the session with new profile photo
      await updateSession();
      
      return data.photoUrl;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload photo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleContinue = async () => {
    setError('');

    // Upload photo if one was selected
    if (profilePhoto) {
      const photoUrl = await uploadPhoto();
      if (!photoUrl && error) {
        return; // Stop if photo upload failed
      }
    }

    // Redirect to main app
    router.push('/app');
  };

  const handleSkip = () => {
    // Skip photo setup and go directly to app
    router.push('/app');
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="text-app-text">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect is in useEffect)
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-app-bg flex flex-col px-4 pt-16 sm:py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-4 sm:mb-8">
          <div className="bg-app-surface-dark rounded-full p-2 sm:p-3 shadow-lg mb-3 sm:mb-4">
            <Image
              src="/logo.png"
              alt="Challenge League"
              width={48}
              height={48}
              className="rounded-full sm:w-16 sm:h-16"
              priority
            />
          </div>
          <h1 className={`${rubik.className} text-2xl sm:text-3xl font-semibold text-app-text text-center`}>
            Welcome, {session.user.username}!
          </h1>
        </div>

        {/* Profile Setup Card */}
        <div className="bg-app-surface py-6 sm:py-8 px-6 shadow-xl rounded-xl border border-app-border">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-app-text text-center">
              Set Up Your Profile
            </h2>
            <p className="text-app-text-secondary text-center mt-2">
              Add a profile photo to personalize your account (optional)
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-app-error-bg border border-app-error text-app-error px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Profile Photo Section */}
          <div className="mb-6">
            <div className="flex flex-col items-center space-y-4">
              {/* Photo Preview */}
              <div className="relative">
                {photoPreview || session.user.profilePhoto ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-app-border-light">
                    <Image
                      src={photoPreview || session.user.profilePhoto || ''}
                      alt="Profile preview"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-app-surface-dark border-2 border-app-border-light flex items-center justify-center">
                    <svg className="w-12 h-12 text-app-text-muted" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                {profilePhoto ? 'Change Photo' : 'Add Profile Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContinue}
              disabled={isUploading}
              className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
            >
              {isUploading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Setting up...
                </div>
              ) : (
                'Continue to Challenge League'
              )}
            </button>

            <button
              onClick={handleSkip}
              disabled={isUploading}
              className="w-full py-2.5 px-4 border border-app-border text-app-text-secondary hover:text-app-text hover:border-app-border-light rounded-xl transition-colors font-medium"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}