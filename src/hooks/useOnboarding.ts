'use client';

import { useState, useEffect } from 'react';

export function useOnboarding() {
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check localStorage for onboarding completion status
    const completed = localStorage.getItem('onboardingCompleted') === 'true';
    setIsOnboardingCompleted(completed);
    
    // Show onboarding automatically for new users
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  const markOnboardingComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setIsOnboardingCompleted(true);
    setShowOnboarding(false);
  };

  const openOnboarding = () => {
    setShowOnboarding(true);
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
  };

  return {
    isOnboardingCompleted,
    showOnboarding,
    markOnboardingComplete,
    openOnboarding,
    closeOnboarding,
  };
}