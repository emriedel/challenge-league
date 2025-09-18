'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import type { League } from '@/types/league';
import ProfileAvatar from './ProfileAvatar';
import ProfileModal from './ProfileModal';
import OnboardingModal from './OnboardingModal';
import NotificationDot from './NotificationDot';
import { useLeagueActions } from '@/hooks/useLeagueActions';
import { rubik } from '@/lib/fonts';


export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isLeaguesOpen, setIsLeaguesOpen] = useState(false);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10; // minimum scroll distance to trigger hide/show

  // Use new hook to fetch leagues with action status
  const { leagues, loading: loadingLeagues, hasAnyActions, refetch: refetchLeagueActions } = useLeagueActions();

  // Detect current league from pathname
  useEffect(() => {
    if (pathname?.startsWith('/app/league/') && leagues.length > 0) {
      const pathParts = pathname.split('/');
      if (pathParts.length >= 4) {
        const leagueId = pathParts[3];
        const found = leagues.find(league => league.id === leagueId);
        setCurrentLeague(found || null);
      }
    } else {
      setCurrentLeague(null);
    }
  }, [pathname, leagues]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setIsLeaguesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smart header visibility based on scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Don't hide header if at the very top of the page
      if (currentScrollY < scrollThreshold) {
        setIsHeaderVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }
      
      // Show header when scrolling up, hide when scrolling down
      if (Math.abs(currentScrollY - lastScrollY.current) > scrollThreshold) {
        if (currentScrollY > lastScrollY.current && currentScrollY > scrollThreshold) {
          // Scrolling down - hide header
          setIsHeaderVisible(false);
        } else {
          // Scrolling up - show header
          setIsHeaderVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrollThreshold]);

  // Don't show navigation on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null;
  }

  return (
    <>
    <header
      className={`sticky top-0 z-40 transition-transform duration-300 bg-app-bg border-b border-app-border ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Link href="/app" className="flex items-center space-x-3 hover:opacity-80 select-none">
              <Image
                src="/logo.png"
                alt="Challenge League"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <span className={`text-2xl font-medium text-white ${rubik.className} sm:block hidden select-none`}>
                Challenge League
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Desktop League Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsLeaguesOpen(!isLeaguesOpen)}
                className="flex items-center text-white/80 hover:text-white select-none touch-manipulation"
              >
                {currentLeague ? currentLeague.name : 'Select League'}
                <svg
                  className={`ml-1 h-4 w-4 ${hasAnyActions ? 'text-red-400' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isLeaguesOpen && (
                <div className="absolute top-full right-0 mt-1 w-80 bg-app-surface border border-app-border rounded-md shadow-lg z-10">
                  <div className="py-1">
                    {loadingLeagues ? (
                      <div className="px-4 py-2 text-sm text-app-text-muted">
                        Loading leagues...
                      </div>
                    ) : leagues.length > 0 ? (
                      <>
                        {leagues.map((league) => (
                          <Link
                            key={league.id}
                            href={`/app/league/${league.id}`}
                            className="block px-4 py-3 text-sm text-app-text hover:bg-app-surface-light select-none touch-manipulation relative"
                            onClick={() => setIsLeaguesOpen(false)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium select-none truncate">{league.name}</span>
                                  {league.needsAction && (
                                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                                  )}
                                </div>
                                {league.currentPrompt && (
                                  <div className="text-xs text-app-text-secondary select-none">
                                    Challenge #{league.currentPrompt.challengeNumber} • {league.currentPrompt.status === 'ACTIVE' ? 'Submissions' : 'Voting'}
                                  </div>
                                )}
                                {league.needsAction && league.actionType && (
                                  <div className="mt-1">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium select-none ${
                                      league.actionType === 'submission'
                                        ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                                        : 'bg-green-900/30 text-green-400 border border-green-800/50'
                                    }`}>
                                      {league.actionType === 'submission' ? 'Submit now!' : 'Vote now!'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {league.isOwner && (
                                <span className="text-xs text-app-info select-none flex-shrink-0 ml-2">Owner</span>
                              )}
                            </div>
                          </Link>
                        ))}
                        <hr className="my-1 border-app-border" />
                        <Link
                          href="/app"
                          className="block px-4 py-2 text-sm text-app-info hover:bg-app-surface-light select-none touch-manipulation"
                          onClick={() => setIsLeaguesOpen(false)}
                        >
                          + Create New League
                        </Link>
                        <Link
                          href="/app"
                          className="block px-4 py-2 text-sm text-app-success hover:bg-app-surface-light select-none touch-manipulation"
                          onClick={() => setIsLeaguesOpen(false)}
                        >
                          + Join League
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-2 text-sm text-app-text-muted">
                          No leagues found
                        </div>
                        <hr className="my-1 border-app-border" />
                        <Link
                          href="/app"
                          className="block px-4 py-2 text-sm text-app-info hover:bg-app-surface-light select-none touch-manipulation"
                          onClick={() => setIsLeaguesOpen(false)}
                        >
                          + Create New League
                        </Link>
                        <Link
                          href="/app"
                          className="block px-4 py-2 text-sm text-app-success hover:bg-app-surface-light select-none touch-manipulation"
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
            
            <div className="flex items-center space-x-4">
              {/* Profile Picture */}
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center hover:opacity-80 transition-opacity select-none touch-manipulation"
              >
                <ProfileAvatar 
                  username={session?.user?.username || session?.user?.email || 'User'}
                  profilePhoto={session?.user?.profilePhoto}
                  size="sm"
                  className="ring-2 ring-white/30 w-8 h-8"
                />
              </button>
            </div>
          </div>

          {/* Mobile Right Section */}
          <div className="md:hidden flex items-center space-x-3">
            {/* League Selector */}
            <div className="relative" ref={mobileDropdownRef}>
              <button
                onClick={() => setIsLeaguesOpen(!isLeaguesOpen)}
                className="flex items-center text-white/80 hover:text-white select-none touch-manipulation"
              >
                <span className="text-sm select-none">{currentLeague ? currentLeague.name : 'Select League'}</span>
                <svg
                  className={`ml-1 h-4 w-4 ${hasAnyActions ? 'text-red-400' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            
            {isLeaguesOpen && (
              <div className="md:absolute md:top-full md:right-0 md:transform-none md:left-auto fixed top-16 left-1/2 transform -translate-x-1/2 md:-translate-x-0 mt-1 w-80 md:max-w-[min(320px,calc(100vw-1rem))] max-w-[calc(100vw-2rem)] bg-app-surface border border-app-border rounded-md shadow-lg z-10">
                <div className="py-1">
                  {loadingLeagues ? (
                    <div className="px-4 py-2 text-sm text-app-text-muted">
                      Loading leagues...
                    </div>
                  ) : leagues.length > 0 ? (
                    <>
                      {leagues.map((league) => (
                        <Link
                          key={league.id}
                          href={`/app/league/${league.id}`}
                          className="block px-4 py-3 text-sm text-app-text hover:bg-app-surface-light select-none touch-manipulation relative"
                          onClick={() => setIsLeaguesOpen(false)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium select-none truncate">{league.name}</span>
                                {league.needsAction && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                                )}
                              </div>
                              {league.currentPrompt && (
                                <div className="text-xs text-app-text-secondary select-none">
                                  Challenge #{league.currentPrompt.challengeNumber} • {league.currentPrompt.status === 'ACTIVE' ? 'Submissions' : 'Voting'}
                                </div>
                              )}
                              {league.needsAction && league.actionType && (
                                <div className="mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium select-none ${
                                    league.actionType === 'submission'
                                      ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                                      : 'bg-green-900/30 text-green-400 border border-green-800/50'
                                  }`}>
                                    {league.actionType === 'submission' ? 'Submit now!' : 'Vote now!'}
                                  </span>
                                </div>
                              )}
                            </div>
                            {league.isOwner && (
                              <span className="text-xs text-app-info select-none flex-shrink-0 ml-2">Owner</span>
                            )}
                          </div>
                        </Link>
                      ))}
                      <hr className="my-1 border-app-border" />
                      <Link
                        href="/app"
                        className="block px-4 py-2 text-sm text-app-info hover:bg-app-surface-light"
                        onClick={() => setIsLeaguesOpen(false)}
                      >
                        + Create New League
                      </Link>
                      <Link
                        href="/app"
                        className="block px-4 py-2 text-sm text-app-success hover:bg-app-surface-light"
                        onClick={() => setIsLeaguesOpen(false)}
                      >
                        + Join League
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-sm text-app-text-muted">
                        No leagues found
                      </div>
                      <hr className="my-1 border-app-border" />
                      <Link
                        href="/app"
                        className="block px-4 py-2 text-sm text-app-info hover:bg-app-surface-light"
                        onClick={() => setIsLeaguesOpen(false)}
                      >
                        + Create New League
                      </Link>
                      <Link
                        href="/app"
                        className="block px-4 py-2 text-sm text-app-success hover:bg-app-surface-light"
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
            
            {/* Profile Picture */}
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center hover:opacity-80 transition-opacity select-none touch-manipulation"
            >
              <ProfileAvatar 
                username={session?.user?.username || session?.user?.email || 'User'}
                profilePhoto={session?.user?.profilePhoto}
                size="sm"
                className="ring-2 ring-white/30 w-8 h-8"
              />
            </button>
          </div>
        </div>

      </div>
    </header>
    
    {/* Profile Modal */}
    <ProfileModal 
      isOpen={isProfileModalOpen} 
      onClose={() => setIsProfileModalOpen(false)} 
    />
    
    {/* Onboarding Modal */}
    <OnboardingModal 
      isOpen={isOnboardingModalOpen} 
      onClose={() => setIsOnboardingModalOpen(false)}
      isNewUserFlow={false}
    />
  </>
  );
}