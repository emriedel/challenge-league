'use client';

import { useSession } from 'next-auth/react';
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
import LeagueAvatar from './LeagueAvatar';


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
                <svg
                  className="mr-1 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span
                  className="relative pr-1 truncate max-w-[160px] lg:max-w-[200px]"
                  title={currentLeague ? currentLeague.name : 'Select League'}
                >
                  {currentLeague ? currentLeague.name : 'Select League'}
                  {hasAnyActions && (
                    <div className="absolute top-0 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  )}
                </span>
              </button>
              
              {isLeaguesOpen && (
                <div className="absolute top-full right-0 mt-1 w-80 bg-app-surface border border-app-border rounded-md shadow-lg z-10">
                  <div className="pt-1">
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
                            className="block px-4 py-3 text-base text-app-text hover:bg-app-surface-light select-none touch-manipulation relative"
                            onClick={() => setIsLeaguesOpen(false)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <LeagueAvatar
                                  leagueName={league.name}
                                  leagueId={league.id}
                                  size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium select-none truncate max-w-[220px]" title={league.name}>{league.name}</span>
                                  </div>
                                  {league.currentPrompt && (
                                    <div className="flex items-center gap-1 text-xs select-none">
                                      <span className="text-app-text-secondary">
                                        Challenge #{league.currentPrompt.challengeNumber} •
                                      </span>
                                      {league.needsAction ? (
                                        <div className="flex items-center gap-1">
                                          <span className="text-red-400 font-medium">
                                            {league.actionType === 'submission' ? 'Submit now!' : 'Vote now!'}
                                          </span>
                                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                        </div>
                                      ) : (
                                        <span className="text-app-text-secondary">
                                          {league.currentPrompt.status === 'ACTIVE' ? 'Submissions Open' : 'Voting Open'}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                        <hr className="mt-1 border-app-border" />
                        <div className="flex">
                          <Link
                            href="/app/new"
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-3 text-sm font-medium text-app-text-secondary bg-app-surface hover:bg-app-surface-light border-r border-app-border select-none touch-manipulation transition-colors rounded-bl-md"
                            onClick={() => setIsLeaguesOpen(false)}
                          >
                            <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create League
                          </Link>
                          <Link
                            href="/app/join"
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-3 text-sm font-medium text-app-text-secondary bg-app-surface hover:bg-app-surface-light select-none touch-manipulation transition-colors rounded-br-md"
                            onClick={() => setIsLeaguesOpen(false)}
                          >
                            <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Join League
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-2 text-sm text-app-text-muted">
                          No leagues found
                        </div>
                        <hr className="mt-1 border-app-border" />
                        <div className="flex">
                          <Link
                            href="/app/new"
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-3 text-sm font-medium text-app-text-secondary bg-app-surface hover:bg-app-surface-light border-r border-app-border select-none touch-manipulation transition-colors rounded-bl-md"
                            onClick={() => setIsLeaguesOpen(false)}
                          >
                            <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create League
                          </Link>
                          <Link
                            href="/app/join"
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-3 text-sm font-medium text-app-text-secondary bg-app-surface hover:bg-app-surface-light select-none touch-manipulation transition-colors rounded-br-md"
                            onClick={() => setIsLeaguesOpen(false)}
                          >
                            <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Join League
                          </Link>
                        </div>
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
          <div className="md:hidden flex items-center space-x-4">
            {/* League Selector */}
            <div className="relative" ref={mobileDropdownRef}>
              <button
                onClick={() => setIsLeaguesOpen(!isLeaguesOpen)}
                className="flex items-center text-white/80 hover:text-white select-none touch-manipulation"
              >
                <svg
                  className="mr-1 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span
                  className="text-sm select-none relative pr-1 truncate max-w-[180px]"
                  title={currentLeague ? currentLeague.name : 'Select League'}
                >
                  {currentLeague ? currentLeague.name : 'Select League'}
                  {hasAnyActions && (
                    <div className="absolute top-0 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  )}
                </span>
              </button>
            
            {isLeaguesOpen && (
              <div className="md:absolute md:top-full md:right-0 md:transform-none md:left-auto fixed top-14 left-1/2 transform -translate-x-1/2 md:-translate-x-0 mt-1 w-80 md:max-w-[min(320px,calc(100vw-1rem))] max-w-[calc(100vw-2rem)] bg-app-surface border border-app-border rounded-md shadow-lg z-10">
                <div className="pt-1">
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
                          className="block px-4 py-3 text-base text-app-text hover:bg-app-surface-light select-none touch-manipulation relative"
                          onClick={() => setIsLeaguesOpen(false)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <LeagueAvatar
                                leagueName={league.name}
                                leagueId={league.id}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium select-none truncate max-w-[220px]" title={league.name}>{league.name}</span>
                                </div>
                                {league.currentPrompt && (
                                  <div className="flex items-center gap-1 text-sm select-none">
                                    <span className="text-app-text-secondary">
                                      Challenge #{league.currentPrompt.challengeNumber} •
                                    </span>
                                    {league.needsAction ? (
                                      <div className="flex items-center gap-1">
                                        <span className="text-red-400 font-medium">
                                          {league.actionType === 'submission' ? 'Submit now!' : 'Vote now!'}
                                        </span>
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                      </div>
                                    ) : (
                                      <span className="text-app-text-secondary">
                                        {league.currentPrompt.status === 'ACTIVE' ? 'Submissions Open' : 'Voting Open'}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                      <hr className="mt-1 border-app-border" />
                      <div className="flex">
                        <Link
                          href="/app/new"
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-3 text-sm font-medium text-app-text-secondary bg-app-surface hover:bg-app-surface-light border-r border-app-border select-none touch-manipulation transition-colors rounded-bl-md"
                          onClick={() => setIsLeaguesOpen(false)}
                        >
                          <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create League
                        </Link>
                        <Link
                          href="/app/join"
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-3 text-sm font-medium text-app-text-secondary bg-app-surface hover:bg-app-surface-light select-none touch-manipulation transition-colors rounded-br-md"
                          onClick={() => setIsLeaguesOpen(false)}
                        >
                          <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Join League
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-sm text-app-text-muted">
                        No leagues found
                      </div>
                      <hr className="mt-1 border-app-border" />
                      <div className="flex">
                        <Link
                          href="/app/new"
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-3 text-sm font-medium text-app-text-secondary bg-app-surface hover:bg-app-surface-light border-r border-app-border select-none touch-manipulation transition-colors rounded-bl-md"
                          onClick={() => setIsLeaguesOpen(false)}
                        >
                          <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create League
                        </Link>
                        <Link
                          href="/app/join"
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-3 text-sm font-medium text-app-text-secondary bg-app-surface hover:bg-app-surface-light select-none touch-manipulation transition-colors rounded-br-md"
                          onClick={() => setIsLeaguesOpen(false)}
                        >
                          <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Join League
                        </Link>
                      </div>
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