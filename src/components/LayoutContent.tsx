'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import BottomNavigation from '@/components/BottomNavigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import LeagueRedirectHandler from '@/components/LeagueRedirectHandler';
import { useBadgeSync } from '@/hooks/useBadgeSync';

interface LayoutContentProps {
  children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();
  const isAuthFlow = pathname?.startsWith('/app/auth/') || pathname?.startsWith('/app/profile/setup');
  const isLeagueSelection = pathname === '/app';
  const isLeagueCreation = pathname === '/app/new' || pathname === '/app/join';

  // Hide bottom nav for auth flows, league selection, and league creation
  const hideBottomNav = isAuthFlow || isLeagueSelection || isLeagueCreation;

  // Sync PWA badge on app focus/resume to handle iOS PWA quirks
  useBadgeSync();

  return (
    <div className="min-h-screen bg-app-bg">
      {!isAuthFlow && <Navigation />}
      <main className={`${hideBottomNav ? '' : 'pb-20 md:pb-0'} ${!isAuthFlow ? 'pt-16 md:pt-0' : ''}`}>
        <ErrorBoundary>
          <LeagueRedirectHandler>
            {children}
          </LeagueRedirectHandler>
        </ErrorBoundary>
      </main>
      {!hideBottomNav && <BottomNavigation />}
      <PWAInstallPrompt />
    </div>
  );
}