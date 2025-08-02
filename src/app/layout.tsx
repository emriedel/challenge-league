import type { Metadata } from 'next';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import Navigation from '@/components/Navigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import { inter } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Challenge League',
  description: 'Creative competition leagues for friends and communities',
  icons: {
    icon: '/challenge-league-logo.png',
    shortcut: '/challenge-league-logo.png',
    apple: '/challenge-league-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <SessionProvider>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <main>
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </main>
            </div>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}