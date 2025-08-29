'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import ProfilePhotoSetup from '@/components/ProfilePhotoSetup';
import { rubik } from '@/lib/fonts';

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
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
              src="/challenge-league-logo.png"
              alt="Challenge League"
              width={48}
              height={48}
              className="rounded-full sm:w-16 sm:h-16"
              priority
            />
          </div>
          <h1 className={`${rubik.className} text-2xl sm:text-3xl font-semibold text-app-text text-center`}>
            Challenge League
          </h1>
        </div>

        <ProfilePhotoSetup 
          username={session.user.username || session.user.email || 'User'}
          onComplete={handleComplete}
          onSkip={handleSkip} 
        />
      </div>
    </div>
  );
}