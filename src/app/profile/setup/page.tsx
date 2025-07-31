'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProfilePhotoSetup from '@/components/ProfilePhotoSetup';

export default function ProfileSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  const handleComplete = () => {
    // Redirect to home page after profile setup
    router.push('/');
  };

  const handleSkip = () => {
    // Allow user to skip and go to home page
    router.push('/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <ProfilePhotoSetup 
          username={session.user.username || session.user.email || 'User'}
          onComplete={handleComplete}
          onSkip={handleSkip} 
        />
      </div>
    </div>
  );
}