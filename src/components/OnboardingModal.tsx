'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: '',
    content: (
      <div className="text-center">
        <div className="mb-6">
          <div className="bg-app-surface-dark rounded-full p-4 shadow-lg mb-4 mx-auto w-20 h-20 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Challenge League"
              width={48}
              height={48}
              className="rounded-full"
              priority
            />
          </div>
          <p className="text-app-text font-semibold text-xl mb-4">
            Welcome to Challenge League!
          </p>
          <p className="text-app-text-secondary text-sm">
            A fun way to challenge your friends to turn everyday life into a game
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'how-it-works',
    title: 'How it works',
    content: (
      <div className="space-y-6">
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-app-surface-dark rounded-lg border border-app-border">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-green-400 font-semibold text-sm">1</span>
            </div>
            <div>
              <h4 className="text-app-text font-semibold text-sm mb-1">Join a League</h4>
              <p className="text-app-text-secondary text-xs">Join a league with your friends or create one for yourself</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-app-surface-dark rounded-lg border border-app-border">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <span className="text-blue-400 font-semibold text-sm">2</span>
            </div>
            <div>
              <h4 className="text-app-text font-semibold text-sm mb-1">Get the Prompt</h4>
              <p className="text-app-text-secondary text-xs">Each week, your league gets a new challenge to test your creativity</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-app-surface-dark rounded-lg border border-app-border">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
              <span className="text-purple-400 font-semibold text-sm">3</span>
            </div>
            <div>
              <h4 className="text-app-text font-semibold text-sm mb-1">Snap & Submit</h4>
              <p className="text-app-text-secondary text-xs">Take your best photo during the challenge period and add a descriptive caption</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-app-surface-dark rounded-lg border border-app-border">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
              <span className="text-amber-400 font-semibold text-sm">4</span>
            </div>
            <div>
              <h4 className="text-app-text font-semibold text-sm mb-1">Vote for Your Favorites</h4>
              <p className="text-app-text-secondary text-xs">Once submissions are in, everyone in the league votes on their favorites</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-app-surface-dark rounded-lg border border-app-border">
            <div className="flex-shrink-0 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-red-400 font-semibold text-sm">5</span>
            </div>
            <div>
              <h4 className="text-app-text font-semibold text-sm mb-1">Do It All Again!</h4>
              <p className="text-app-text-secondary text-xs">A new challenge arrives every week for a fresh chance to climb the leaderboard</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'rules',
    title: 'Submission Rules',
    content: (
      <div className="space-y-6">

        <div className="space-y-4">
          <div className="bg-app-surface-dark rounded-lg p-5 border border-app-border">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-app-text font-semibold mb-2">Original Photos Only</h4>
                <p className="text-app-text-secondary text-sm">All photos must be taken by you. No internet images, AI, or borrowing from others.</p>
              </div>
            </div>
          </div>

          <div className="bg-app-surface-dark rounded-lg p-5 border border-app-border">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0 w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-app-text font-semibold mb-2">Timely Submissions</h4>
                <p className="text-app-text-secondary text-sm">Photos must be taken during the current challenge period — no digging through old albums.</p>
              </div>
            </div>
          </div>

          <div className="bg-app-surface-dark rounded-lg p-5 border border-app-border">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.998 1.998 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h4 className="text-app-text font-semibold mb-2">One Entry Per Challenge</h4>
                <p className="text-app-text-secondary text-sm">Each player gets one submission per challenge. Make it count!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'final-steps',
    title: 'Final Steps',
    content: (
      <div className="space-y-6">

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-5 border border-blue-500/20">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.343 15.657l2.828 2.828a1 1 0 001.414 0l9.192-9.192a1 1 0 000-1.414l-2.828-2.828a1 1 0 00-1.414 0L4.343 14.243a1 1 0 000 1.414z" />
                </svg>
              </div>
              <div>
                <h4 className="text-app-text font-semibold mb-2">1. Turn on Notifications</h4>
                <p className="text-app-text-secondary text-sm">Get notified when a new challenge is available or when voting starts.</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-5 border border-green-500/20">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-app-text font-semibold mb-2">2. Install the App</h4>
                <p className="text-app-text-secondary text-sm">Make sure you&rsquo;ve installed the app on your phone if you haven&rsquo;t already!</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-5 border border-amber-500/20">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-amber-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-app-text font-semibold mb-2">3. Have Fun!</h4>
                <p className="text-app-text-secondary text-sm">Most importantly, let your creativity run wild and enjoy the friendly competition!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
];

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Mark onboarding as completed in localStorage
    localStorage.setItem('onboardingCompleted', 'true');
    onComplete?.();
    onClose();
  };

  // Reset to first step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[70] transition-opacity duration-300 ease-out" />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-app-surface border border-app-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-center p-6 border-b border-app-border bg-app-bg flex-shrink-0">
            <h2 className={`text-xl font-semibold text-app-text text-center ${rubik.className}`}>
              {currentStepData.title}
            </h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6">
              {currentStepData.content}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center p-6 border-t border-app-border bg-app-surface-dark flex-shrink-0">
            <div className="flex-1 flex justify-start">
              {currentStep === 0 ? (
                <div className="w-10 h-10" />
              ) : (
                <button
                  onClick={handlePrevious}
                  className="w-10 h-10 flex items-center justify-center text-app-text-secondary hover:text-app-text transition-colors rounded-lg hover:bg-app-surface-light"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="flex space-x-2">
              {ONBOARDING_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep 
                      ? 'bg-[#3a8e8c]' 
                      : index < currentStep 
                        ? 'bg-[#3a8e8c]/60' 
                        : 'bg-app-border'
                  }`}
                />
              ))}
            </div>

            <div className="flex-1 flex justify-end">
              {isLastStep ? (
                <button
                  onClick={handleComplete}
                  className="w-10 h-10 flex items-center justify-center bg-[#3a8e8c] hover:bg-[#2d6f6d] text-white rounded-lg transition-all duration-200 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-10 h-10 flex items-center justify-center bg-[#3a8e8c] hover:bg-[#2d6f6d] text-white rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}