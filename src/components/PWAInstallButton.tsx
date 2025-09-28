'use client';

import { useState, useEffect } from 'react';

interface PWAInstallButtonProps {
  variant?: 'primary' | 'secondary';
}

export default function PWAInstallButton({ variant = 'primary' }: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if it's iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if app is already installed (more careful detection)
    // For iOS, only check navigator.standalone (not display-mode)
    // For Android, check display-mode and document.referrer
    const standalone = iOS
      ? (window.navigator as any).standalone === true
      : window.matchMedia('(display-mode: standalone)').matches ||
        document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Debug logging for iOS
    if (iOS) {
      console.log('PWAInstallButton Debug:', {
        iOS,
        standalone,
        userAgent: navigator.userAgent,
        navigatorStandalone: (window.navigator as any).standalone,
        displayMode: window.matchMedia('(display-mode: standalone)').matches
      });
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
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

  // Debug logging for render decision
  if (mounted && isIOS) {
    console.log('PWAInstallButton Render Decision:', {
      mounted,
      isStandalone,
      isInstallable,
      isIOS,
      shouldShow: mounted && !isStandalone && (isInstallable || isIOS)
    });
  }

  // Don't show if already installed
  if (!mounted || isStandalone) {
    return null;
  }

  // Don't show if neither installable nor iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  const baseClasses = "w-full sm:w-auto px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 text-center";
  const primaryClasses = "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white";
  const secondaryClasses = "bg-white text-blue-600 hover:bg-gray-50";

  return (
    <button
      onClick={isIOS ? handleIOSInstall : handleInstallClick}
      className={`${baseClasses} ${variant === 'primary' ? primaryClasses : secondaryClasses}`}
    >Install the App
    </button>
  );
}