'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || null;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setSuccess(true);
        // Redirect to sign in after 2 seconds
        setTimeout(() => {
          router.push('/app/auth/signin');
        }, 2000);
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

        {/* Reset Password Card */}
        <div className="bg-app-surface py-6 sm:py-8 px-6 shadow-xl rounded-xl border border-app-border">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-app-text text-center">
              Create New Password
            </h2>
            <p className="mt-2 text-sm text-app-text-secondary text-center">
              Enter your new password below.
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="bg-app-success-bg border border-app-success text-app-success px-4 py-3 rounded-lg text-sm">
                Password reset successful! Redirecting to sign in...
              </div>
            </div>
          ) : (
            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-app-error-bg border border-app-error text-app-error px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-app-text-secondary mb-1.5">
                    New Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full px-4 py-2.5 sm:py-3 border border-app-border-light bg-app-surface-dark text-app-text rounded-xl shadow-sm placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter new password (min 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-app-text-secondary mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full px-4 py-2.5 sm:py-3 border border-app-border-light bg-app-surface-dark text-app-text rounded-xl shadow-sm placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !token}
                className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-[#3a8e8c] hover:bg-[#338a88] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3a8e8c] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </div>
                ) : (
                  'Reset Password'
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="text-app-text">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
