import type { Metadata } from 'next';
import '../globals.css';
import SessionProvider from '@/components/SessionProvider';
import QueryProvider from '@/components/QueryProvider';
import Navigation from '@/components/Navigation';
import BottomNavigation from '@/components/BottomNavigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import LayoutContent from '@/components/LayoutContent';

export const metadata: Metadata = {
  title: 'Challenge League',
  description: 'Creative competition leagues for friends and communities',
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <SessionProvider>
          <LayoutContent>
            {children}
          </LayoutContent>
        </SessionProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}