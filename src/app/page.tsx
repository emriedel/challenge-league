import Link from 'next/link';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';
import PWAInstallButton from '@/components/PWAInstallButton';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-app-bg">
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
            <p className="text-xl sm:text-2xl text-app-text-secondary mb-4 max-w-3xl mx-auto">
              Creative competitions that bring friends together
            </p>
            <p className="text-lg text-app-text-muted mb-12 max-w-2xl mx-auto">
              Join weekly photo challenges, vote on submissions, and climb the leaderboard in friendly competition with your community.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <PWAInstallButton />
              <Link
                href="/app"
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
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
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-app-text mb-4">
              How It Works
            </h2>
            <p className="text-lg text-app-text-secondary max-w-2xl mx-auto">
              Simple, fun, and engaging creative competitions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-blue-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-app-text mb-4">Submit Creative Photos</h3>
              <p className="text-app-text-secondary">
                Complete weekly challenges by submitting photos with captions during the 7-day submission phase.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-purple-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-app-text mb-4">Vote for Favorites</h3>
              <p className="text-app-text-secondary">
                Cast your 3 votes during the 2-day voting phase. Each vote gives 1 point to your chosen submission.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-amber-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-app-text mb-4">Climb the Leaderboard</h3>
              <p className="text-app-text-secondary">
                Earn points from votes and compete with friends to see who wins the most challenges.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-app-text mb-4">
              Why Choose Challenge League?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-app-surface border border-app-border rounded-xl p-6">
              <div className="text-green-500 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-app-text mb-3">Community Building</h3>
              <p className="text-app-text-secondary">Create leagues with friends, family, or communities and strengthen bonds through shared creativity.</p>
            </div>

            <div className="bg-app-surface border border-app-border rounded-xl p-6">
              <div className="text-blue-500 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-app-text mb-3">Weekly Engagement</h3>
              <p className="text-app-text-secondary">Regular challenges keep everyone engaged with fresh, creative prompts every week.</p>
            </div>

            <div className="bg-app-surface border border-app-border rounded-xl p-6">
              <div className="text-purple-500 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-app-text mb-3">Easy to Use</h3>
              <p className="text-app-text-secondary">Simple interface designed for all ages. Upload photos, vote with double-taps, and track progress effortlessly.</p>
            </div>

            <div className="bg-app-surface border border-app-border rounded-xl p-6">
              <div className="text-amber-500 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-app-text mb-3">Spark Creativity</h3>
              <p className="text-app-text-secondary">Diverse challenges covering cooking, photography, art, and adventure to inspire new perspectives.</p>
            </div>

            <div className="bg-app-surface border border-app-border rounded-xl p-6">
              <div className="text-red-500 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-app-text mb-3">Fair Competition</h3>
              <p className="text-app-text-secondary">Anonymous voting and point-based ranking ensure every submission gets a fair chance to win.</p>
            </div>

            <div className="bg-app-surface border border-app-border rounded-xl p-6">
              <div className="text-indigo-500 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-app-text mb-3">Mobile First</h3>
              <p className="text-app-text-secondary">PWA technology provides app-like experience on any device, with offline capabilities and push notifications.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Start Competing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the creative community and see what challenges await you today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PWAInstallButton variant="secondary" />
            <Link
              href="/app"
              className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl shadow-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
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
            <p className="text-app-text-muted">
              Creative competitions for friends and communities
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}