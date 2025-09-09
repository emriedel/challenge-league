'use client';

import { useState, useEffect } from 'react';

interface PWAInstallButtonProps {
  variant?: 'primary' | 'secondary';
}

export default function PWAInstallButton({ variant = 'primary' }: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  if (!mounted || !isInstallable) {
    return null;
  }

  const baseClasses = "px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105";
  const primaryClasses = "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white";
  const secondaryClasses = "bg-white text-blue-600 hover:bg-gray-50";

  return (
    <button
      onClick={handleInstallClick}
      className={`${baseClasses} ${variant === 'primary' ? primaryClasses : secondaryClasses}`}
    >
      📱 Install Challenge League
    </button>
  );
}