import type { Metadata, Viewport } from 'next';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import Navigation from '@/components/Navigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { inter } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Challenge League',
  description: 'Creative competition leagues for friends and communities',
  icons: {
    icon: '/challenge-league-logo.png',
    shortcut: '/challenge-league-logo.png',
    apple: '/challenge-league-logo.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Challenge League',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2d8cff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
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
              <PWAInstallPrompt />
            </div>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}