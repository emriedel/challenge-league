'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

interface League {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  isOwner: boolean;
}

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isLeaguesOpen, setIsLeaguesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch user's leagues when authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setLoadingLeagues(true);
      fetch('/api/leagues')
        .then(res => res.json())
        .then(data => {
          if (data.leagues) {
            setLeagues(data.leagues);
          }
        })
        .catch(error => {
          console.error('Error fetching leagues:', error);
        })
        .finally(() => {
          setLoadingLeagues(false);
        });
    }
  }, [status, session]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLeaguesOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't show navigation on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null;
  }

  return (
    <header className="shadow-sm border-b" style={{ backgroundColor: '#2d8cff' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80">
            <Image
              src="/challenge-league-logo.png"
              alt="Challenge League"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="text-2xl font-bold text-white">
              Challenge League
            </span>
          </Link>
          
          <div className="flex items-center space-x-8">
            {status === 'authenticated' ? (
              <>
                <nav className="flex space-x-8">
                  <Link 
                    href="/how-it-works" 
                    className="text-white/80 hover:text-white"
                  >
                    How it works
                  </Link>
                  
                  {/* Leagues Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsLeaguesOpen(!isLeaguesOpen)}
                      className="flex items-center text-white/80 hover:text-white"
                    >
                      Leagues
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isLeaguesOpen && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        <div className="py-1">
                          {loadingLeagues ? (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              Loading leagues...
                            </div>
                          ) : leagues.length > 0 ? (
                            <>
                              {leagues.map((league) => (
                                <Link
                                  key={league.id}
                                  href={`/league/${league.slug}`}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => setIsLeaguesOpen(false)}
                                >
                                  <div className="flex justify-between items-center">
                                    <span>{league.name}</span>
                                    {league.isOwner && (
                                      <span className="text-xs text-blue-500">Owner</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {league.memberCount} member{league.memberCount !== 1 ? 's' : ''}
                                  </div>
                                </Link>
                              ))}
                              <hr className="my-1" />
                              <Link
                                href="/leagues/new"
                                className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                                onClick={() => setIsLeaguesOpen(false)}
                              >
                                + Create New League
                              </Link>
                              <Link
                                href="/leagues/join"
                                className="block px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                                onClick={() => setIsLeaguesOpen(false)}
                              >
                                + Join League
                              </Link>
                            </>
                          ) : (
                            <>
                              <div className="px-4 py-2 text-sm text-gray-500">
                                No leagues found
                              </div>
                              <hr className="my-1" />
                              <Link
                                href="/leagues/new"
                                className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                                onClick={() => setIsLeaguesOpen(false)}
                              >
                                + Create New League
                              </Link>
                              <Link
                                href="/leagues/join"
                                className="block px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                                onClick={() => setIsLeaguesOpen(false)}
                              >
                                + Join League
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </nav>
                
                <div className="flex items-center space-x-4">
                  {/* User Menu Dropdown */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center text-sm text-white/80 hover:text-white"
                    >
                      @{session.user.username}
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isUserMenuOpen && (
                      <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        <div className="py-1">
                          <Link
                            href="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            View Profile
                          </Link>
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              signOut();
                            }}
                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/how-it-works"
                  className="text-white/80 hover:text-white"
                >
                  How it works
                </Link>
                <Link
                  href="/auth/signin"
                  className="text-white/80 hover:text-white"
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