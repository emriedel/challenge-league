import Link from 'next/link';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';
import PWAInstallButton from '@/components/PWAInstallButton';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <header className="border-b border-app-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="Challenge League"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className={`${rubik.className} text-lg font-semibold text-app-text hidden sm:inline`}>
                Challenge League
              </span>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/app/auth/signin"
                className="px-4 py-2 text-app-text hover:text-app-text-secondary transition-colors text-center"
              >
                Sign in
              </Link>
              <Link
                href="/app/auth/signup"
                className="px-4 py-2 bg-[#3a8e8c] hover:bg-[#2d726f] text-white rounded-lg transition-colors text-center"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="grid lg:grid-cols-3 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left lg:col-span-2">
              {/* Hero Text */}
              <h1 className={`${rubik.className} text-4xl sm:text-6xl font-bold text-app-text mb-6`}>
                Welcome to Challenge League!
              </h1>
              <p className="text-xl sm:text-2xl text-app-text-secondary mb-12 max-w-3xl lg:max-w-none">
                Take photos to beat your friends in weekly creative challenges
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <PWAInstallButton />
                <Link
                  href="/app/auth/signup"
                  className="w-full sm:w-auto px-8 py-4 bg-[#3a8e8c] hover:bg-[#2d726f] text-white text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Right Column - App Screenshot */}
            <div className="flex justify-center lg:justify-end lg:col-span-1">
              <div className="w-full max-w-xs flex justify-center">
                <Image
                  src="/app-screenshot.png"
                  alt="Challenge League mobile app showing voting interface"
                  width={300}
                  height={600}
                  className="rounded-3xl shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-app-surface">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-app-text mb-4">
              How to play Challenge League
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center bg-app-bg border border-app-border rounded-lg p-8 hover:border-[#3a8e8c]/50 transition-colors">
              <div className="bg-[#3a8e8c]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#3a8e8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-app-text mb-4">Join or create a league</h3>
              <p className="text-app-text-secondary">
                Start or join a league with your friends to begin competing in creative challenges
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center bg-app-bg border border-app-border rounded-lg p-8 hover:border-blue-500/50 transition-colors">
              <div className="bg-blue-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-app-text mb-4">Submit the best photo</h3>
              <p className="text-app-text-secondary">
                Each week, everyone in your league will receive the same new challenge. Submit the best response to win!
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center bg-app-bg border border-app-border rounded-lg p-8 hover:border-purple-500/50 transition-colors">
              <div className="bg-purple-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-app-text mb-4">Vote and climb the leaderboard</h3>
              <p className="text-app-text-secondary">
                Vote on your favorites, earn points for your submissions, and compete to reach the top of the leaderboard
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black py-12">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              © 2025 Challenge League. Made by Eric Riedel.
            </p>
          </div>
      </footer>
    </div>
  );
}