'use client';

import { useState, useEffect } from 'react';

export function useOnboarding() {
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewUserFlow, setIsNewUserFlow] = useState(false);

  useEffect(() => {
    // Check localStorage for onboarding completion status
    const completed = localStorage.getItem('onboardingCompleted') === 'true';
    setIsOnboardingCompleted(completed);
    
    // Show onboarding automatically for new users
    if (!completed) {
      setShowOnboarding(true);
      setIsNewUserFlow(true);
    }
  }, []);

  const markOnboardingComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setIsOnboardingCompleted(true);
    setShowOnboarding(false);
  };

  const openOnboarding = () => {
    setShowOnboarding(true);
    setIsNewUserFlow(false); // Manual trigger, not new user flow
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
    setIsNewUserFlow(false);
  };

  return {
    isOnboardingCompleted,
    showOnboarding,
    isNewUserFlow,
    markOnboardingComplete,
    openOnboarding,
    closeOnboarding,
  };
}