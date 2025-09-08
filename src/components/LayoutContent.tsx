'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import BottomNavigation from '@/components/BottomNavigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import NotificationDebugPanel from '@/components/NotificationDebugPanel';
import IOSDebugPanel from '@/components/IOSDebugPanel';

interface LayoutContentProps {
  children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();
  const isAuthFlow = pathname?.startsWith('/auth/') || pathname?.startsWith('/profile/setup');
  const isLeagueSelection = pathname === '/';
  const isLeagueCreation = pathname === '/leagues/new' || pathname === '/leagues/join';
  
  // Hide bottom nav for auth flows, league selection, and league creation
  const hideBottomNav = isAuthFlow || isLeagueSelection || isLeagueCreation;

  return (
    <div className="min-h-screen bg-app-bg">
      {!isAuthFlow && <Navigation />}
      <main className={hideBottomNav ? '' : 'pb-20 md:pb-0'}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      {!hideBottomNav && <BottomNavigation />}
      <PWAInstallPrompt />
      <NotificationDebugPanel />
      <IOSDebugPanel />
    </div>
  );
}