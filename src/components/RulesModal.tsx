'use client';

import { useEffect } from 'react';
import { rubik } from '@/lib/fonts';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  // Close modal on ESC key and prevent scrolling/pull-to-refresh
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
      // Prevent pull-to-refresh on mobile
      document.body.style.overscrollBehavior = 'none';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
      document.body.style.overscrollBehavior = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[70] transition-opacity duration-300 ease-out"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-app-surface border border-app-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[70vh] sm:max-h-[60vh] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-app-border bg-app-bg flex-shrink-0">
            <div className="w-6 h-6" />
            <h2 className={`text-xl font-semibold text-app-text text-center ${rubik.className}`}>
              Submission Rules
            </h2>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-app-text-secondary hover:text-app-text transition-colors rounded-lg hover:bg-app-surface-light"
              data-testid="close-rules-modal"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            <div className="space-y-4">
              <div className="bg-app-surface-dark rounded-lg p-5 border border-app-border">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
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
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-app-text font-semibold mb-2">Timely Photos</h4>
                    <p className="text-app-text-secondary text-sm">Photos must be taken during the current challenge period</p>
                  </div>
                </div>
              </div>

              <div className="bg-app-surface-dark rounded-lg p-5 border border-app-border">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-app-text font-semibold mb-2">Vote to Earn Points</h4>
                    <p className="text-app-text-secondary text-sm">You must vote in order to earn points for your own submission for a given round</p>
                  </div>
                </div>
              </div>

              <div className="bg-app-surface-dark rounded-lg p-5 border border-app-border">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-app-text font-semibold mb-2">Edit Anytime</h4>
                    <p className="text-app-text-secondary text-sm">You can always change your submission until the deadline</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center p-4 border-t border-app-border bg-app-surface-dark flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#3a8e8c] hover:bg-[#2d6f6d] text-white rounded-lg transition-all duration-200 font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
