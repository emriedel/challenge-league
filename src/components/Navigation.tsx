'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isLeaguesOpen, setIsLeaguesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Don't show navigation on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null;
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLeaguesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
            Glimpse
          </Link>
          
          <div className="flex items-center space-x-8">
            {status === 'authenticated' ? (
              <>
                <nav className="flex space-x-8">
                  <Link 
                    href="/how-it-works" 
                    className="text-gray-500 hover:text-gray-900"
                  >
                    How it works
                  </Link>
                  
                  {/* Leagues Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsLeaguesOpen(!isLeaguesOpen)}
                      className="flex items-center text-gray-500 hover:text-gray-900"
                    >
                      Leagues
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isLeaguesOpen && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        <div className="py-1">
                          <Link
                            href="/league/main"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsLeaguesOpen(false)}
                          >
                            Main League
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </nav>
                
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/profile"
                    className="text-sm text-gray-700 hover:text-gray-900"
                  >
                    @{session.user.username}
                  </Link>
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
                  href="/how-it-works"
                  className="text-gray-500 hover:text-gray-700"
                >
                  How it works
                </Link>
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