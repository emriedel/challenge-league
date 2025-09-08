import type { Metadata, Viewport } from 'next';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import QueryProvider from '@/components/QueryProvider';
import Navigation from '@/components/Navigation';
import BottomNavigation from '@/components/BottomNavigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import LayoutContent from '@/components/LayoutContent';
import { inter } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Challenge League',
  description: 'Creative competition leagues for friends and communities',
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/icon-152x152.png', // Apple uses 152x152 for touch icons
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
                      console.log('📱 Registering service worker for PWA...');
                      
                      // More aggressive options for iOS PWA compatibility
                      var options = { 
                        scope: '/',
                        updateViaCache: 'none' // Force fresh fetches for updates
                      };
                      
                      navigator.serviceWorker.register('/sw.js', options)
                        .then(function(registration) {
                          console.log('✅ SW registered successfully:', registration);
                          console.log('🔧 SW scope:', registration.scope);
                          console.log('🔧 SW state:', registration.installing ? 'installing' : 
                                       registration.waiting ? 'waiting' : 
                                       registration.active ? 'active' : 'unknown');
                          
                          // Listen for service worker updates
                          registration.addEventListener('updatefound', function() {
                            console.log('🔄 SW update found, installing new version');
                          });
                        })
                        .catch(function(registrationError) {
                          console.error('❌ SW registration failed:', registrationError);
                          console.error('❌ Error name:', registrationError.name);
                          console.error('❌ Error message:', registrationError.message);
                          console.error('❌ Error stack:', registrationError.stack);
                        });
                    } else {
                      console.log('✅ Service worker already registered:', registration);
                      console.log('🔧 Existing SW scope:', registration.scope);
                    }
                  }).catch(function(error) {
                    console.error('❌ Failed to check SW registration:', error);
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
          <QueryProvider>
            <SessionProvider>
              <LayoutContent>
                {children}
              </LayoutContent>
            </SessionProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}