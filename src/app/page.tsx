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
              <span className={`${rubik.className} text-lg font-semibold text-app-text`}>
                Challenge League
              </span>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/auth/signin"
                className="px-4 py-2 text-app-text hover:text-app-text-secondary transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 bg-[#3a8e8c] hover:bg-[#2d726f] text-white rounded-lg transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="bg-app-surface-dark rounded-full p-4 shadow-xl">
                <Image
                  src="/logo.png"
                  alt="Challenge League"
                  width={80}
                  height={80}
                  className="rounded-full"
                  priority
                />
              </div>
            </div>

            {/* Hero Text */}
            <h1 className={`${rubik.className} text-4xl sm:text-6xl font-bold text-app-text mb-6`}>
              Challenge League
            </h1>
            <p className="text-xl sm:text-2xl text-app-text-secondary mb-12 max-w-3xl mx-auto">
              Turn everyday life into a game
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <PWAInstallButton />
              <Link
                href="/app"
                className="px-8 py-4 bg-[#3a8e8c] hover:bg-[#2d726f] text-white text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-app-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-blue-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-app-text mb-4">Receive Challenges</h3>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-purple-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-app-text mb-4">Submit creative responses</h3>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-amber-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-app-text mb-4">Vote on your favorites</h3>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-[#3a8e8c] to-[#2d726f]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">
            Sign up and join a league to get started today!
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PWAInstallButton variant="secondary" />
            <Link
              href="/app"
              className="px-8 py-4 bg-white text-[#3a8e8c] text-lg font-semibold rounded-xl shadow-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
            >
              Start Playing Now
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-app-surface border-t border-app-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-2 mb-4">
              <Image
                src="/logo.png"
                alt="Challenge League"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className={`${rubik.className} text-lg font-semibold text-app-text`}>
                Challenge League
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}