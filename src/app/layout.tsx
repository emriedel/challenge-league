import type { Metadata, Viewport } from 'next';
import './globals.css';
import { inter } from '@/lib/fonts';
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Challenge League',
  description: 'Creative competition leagues for friends and communities',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
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
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000', // Matches app-bg
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
                // iOS PWA-friendly service worker registration
                function registerServiceWorker() {
                  // Check if service worker is already registered to avoid conflicts
                  navigator.serviceWorker.getRegistration().then(function(registration) {
                    if (!registration) {
                      // More aggressive options for iOS PWA compatibility
                      var options = { 
                        scope: '/',
                        updateViaCache: 'none' // Force fresh fetches for updates
                      };
                      
                      navigator.serviceWorker.register('/sw.js', options)
                        .then(function(registration) {
                          // Service worker registered successfully
                        })
                        .catch(function(registrationError) {
                          console.error('Service worker registration failed:', registrationError);
                        });
                    } else {
                      // Service worker already registered
                    }
                  }).catch(function(error) {
                    console.error('Failed to check SW registration:', error);
                  });
                }

                // Try immediate registration for iOS PWA, fallback to load event
                if (document.readyState === 'loading') {
                  window.addEventListener('load', registerServiceWorker);
                } else {
                  setTimeout(registerServiceWorker, 100);
                }
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}