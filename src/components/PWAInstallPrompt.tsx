'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if it's a mobile device
    const mobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   window.matchMedia('(max-width: 768px)').matches;
    setIsMobile(mobile);

    // Check if it's iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if app is already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone || 
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show install button on mobile devices to reduce noise
      if (mobile) {
        setShowInstallButton(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallButton(false);
      }
    }
  };

  const handleIOSInstall = () => {
    alert(
      'To install this app on your iOS device:\n\n' +
      '1. Tap the Share button\n' +
      '2. Scroll down and tap "Add to Home Screen"\n' +
      '3. Tap "Add" to confirm'
    );
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowInstallButton(false);
  };

  // Don't show if already installed, not on mobile, or dismissed
  if (isStandalone || !isMobile || isDismissed) {
    return null;
  }

  // Show appropriate install prompt
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-blue-700 text-white p-4 rounded-lg shadow-lg z-50 cursor-pointer hover:bg-blue-600 transition-colors"
           onClick={handleIOSInstall}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">Install Challenge League</p>
            <p className="text-xs opacity-90">Add to your home screen for easy access</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleIOSInstall();
              }}
              className="bg-white text-blue-700 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
            >
              Install
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="text-white/80 hover:text-white p-1"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showInstallButton && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-blue-700 text-white p-4 rounded-lg shadow-lg z-50 cursor-pointer hover:bg-blue-600 transition-colors"
           onClick={handleInstallClick}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">Install Challenge League</p>
            <p className="text-xs opacity-90">Get the full app experience</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleInstallClick();
              }}
              className="bg-white text-blue-700 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
            >
              Install
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="text-white/80 hover:text-white p-1"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}