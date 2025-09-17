'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useLeagueActions } from '@/hooks/useLeagueActions';

interface LeagueRedirectHandlerProps {
  children: React.ReactNode;
}

export default function LeagueRedirectHandler({ children }: LeagueRedirectHandlerProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { leagues, loading } = useLeagueActions();

  useEffect(() => {
    // Only handle redirect for the league selection page
    if (pathname !== '/app') {
      return;
    }

    // Don't redirect if still loading or not authenticated
    if (status === 'loading' || loading || !session) {
      return;
    }

    // Auto-redirect logic: if user has exactly one league, redirect to it
    if (leagues.length === 1) {
      router.replace(`/app/league/${leagues[0].id}`);
    }
  }, [session, status, router, pathname, loading, leagues]);

  // If we're on the league selection page and have exactly one league,
  // show loading state to prevent any flash before redirect
  if (pathname === '/app' && session && !loading && leagues.length === 1) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-app-text-muted">Redirecting to your league...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}