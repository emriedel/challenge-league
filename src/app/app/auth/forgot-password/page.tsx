'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setSuccess(true);
        setEmail(''); // Clear the email field
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col px-4 pt-16 sm:py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-4 sm:mb-8">
          <div className="bg-app-surface-dark rounded-full p-2 sm:p-3 shadow-lg mb-3 sm:mb-4">
            <Image
              src="/logo.png"
              alt="Challenge League"
              width={48}
              height={48}
              className="rounded-full sm:w-16 sm:h-16"
              priority
            />
          </div>
          <h1 className={`${rubik.className} text-2xl sm:text-3xl font-semibold text-app-text text-center`}>
            Challenge League
          </h1>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-app-surface py-6 sm:py-8 px-6 shadow-xl rounded-xl border border-app-border">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-app-text text-center">
              Reset Your Password
            </h2>
            <p className="mt-2 text-sm text-app-text-secondary text-center">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="bg-app-success-bg border border-app-success text-app-success px-4 py-3 rounded-lg text-sm">
                Check your email! If an account exists with that email address, we&apos;ve sent you a password reset link.
              </div>
              <div className="text-center">
                <Link
                  href="/app/auth/signin"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  ← Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-app-error-bg border border-app-error text-app-error px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-app-text-secondary mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-4 py-2.5 sm:py-3 border border-app-border-light bg-app-surface-dark text-app-text rounded-xl shadow-sm placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-[#3a8e8c] hover:bg-[#338a88] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3a8e8c] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              {/* Back to Sign In Link */}
              <div className="text-center">
                <Link
                  href="/app/auth/signin"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  ← Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
