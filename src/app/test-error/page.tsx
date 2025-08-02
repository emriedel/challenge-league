'use client';

import { useState } from 'react';

export default function TestErrorPage() {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error('This is a test error to demonstrate the error boundary!');
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Boundary Test</h1>
        <p className="text-gray-600 mb-6">
          Click the button below to trigger an error and see the error boundary in action.
        </p>
        
        <button
          onClick={() => setShouldCrash(true)}
          className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          Trigger Error
        </button>
      </div>
    </div>
  );
}