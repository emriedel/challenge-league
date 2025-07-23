'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Don't show navigation on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
            Glimpse
          </Link>
          
          <div className="flex items-center space-x-8">
            {status === 'authenticated' ? (
              <>
                <nav className="flex space-x-8">
                  <Link 
                    href="/" 
                    className={`pb-4 ${
                      pathname === '/' 
                        ? 'text-gray-900 font-medium border-b-2 border-primary-500 -mb-px' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Gallery
                  </Link>
                  <Link 
                    href="/submit" 
                    className={`pb-4 ${
                      pathname === '/submit' 
                        ? 'text-gray-900 font-medium border-b-2 border-primary-500 -mb-px' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Submit
                  </Link>
                </nav>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    @{session.user.username}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/signin"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}