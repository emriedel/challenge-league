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
      setShowInstallButton(true);
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

  // Don't show if already installed or not on mobile
  if (isStandalone || !isMobile) {
    return null;
  }

  // Show appropriate install prompt
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Install Challenge League</p>
            <p className="text-xs opacity-90">Add to your home screen for easy access</p>
          </div>
          <button
            onClick={handleIOSInstall}
            className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium"
          >
            Install
          </button>
        </div>
      </div>
    );
  }

  if (showInstallButton && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Install Challenge League</p>
            <p className="text-xs opacity-90">Get the full app experience</p>
          </div>
          <button
            onClick={handleInstallClick}
            className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium"
          >
            Install
          </button>
        </div>
      </div>
    );
  }

  return null;
}