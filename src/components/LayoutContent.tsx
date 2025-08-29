'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import BottomNavigation from '@/components/BottomNavigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

interface LayoutContentProps {
  children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();
  const isAuthFlow = pathname?.startsWith('/auth/') || pathname?.startsWith('/profile/setup');

  return (
    <div className="min-h-screen bg-app-bg">
      {!isAuthFlow && <Navigation />}
      <main className={isAuthFlow ? '' : 'pb-20 md:pb-0'}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      {!isAuthFlow && <BottomNavigation />}
      <PWAInstallPrompt />
    </div>
  );
}