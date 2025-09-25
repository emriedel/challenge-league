'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, memo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { navigationRefreshManager } from '@/lib/navigationRefresh';
import { useNavigationNotifications } from '@/hooks/useNavigationNotifications';
import { usePrefetchNavigationTargets } from '@/hooks/useBackgroundPrefetch';
import NotificationDot from '@/components/NotificationDot';

const BottomNavigation = memo(function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentLeagueId, setCurrentLeagueId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get notification states for the current league
  const {
    challengeNotification,
    resultsNotification,
    chatNotification
  } = useNavigationNotifications(currentLeagueId || undefined);

  // Enable background prefetching for smoother navigation
  usePrefetchNavigationTargets(currentLeagueId || '', pathname || undefined);

  // Extract league ID from current path
  useEffect(() => {
    if (pathname?.startsWith('/app/league/')) {
      const pathParts = pathname.split('/');
      if (pathParts.length >= 4) {
        setCurrentLeagueId(pathParts[3]);
      }
    } else {
      // For non-league pages, we'll use redirect logic
      setCurrentLeagueId(null);
    }
  }, [pathname]);

  // Handle tab click with immediate navigation and optional scroll-to-top behavior
  const handleTabClick = async (href: string, isActive: boolean, tabName: string, e: React.MouseEvent) => {
    e.preventDefault();

    if (isActive && currentLeagueId) {
      // Only handle scroll/refresh for already active pages
      const result = await navigationRefreshManager.handleNavigationTap(tabName.toLowerCase());

      // If no custom handlers were registered, fall back to query invalidation
      // Check if we're at the top using the same logic as navigationRefreshManager
      let isAtTop = false;
      const pullToRefreshContainer = document.querySelector('[data-pull-to-refresh-container]') as HTMLElement;
      if (pullToRefreshContainer) {
        isAtTop = pullToRefreshContainer.scrollTop <= 10;
      } else {
        isAtTop = window.pageYOffset <= 10;
      }

      if (result === 'scrolled' && isAtTop) {
        // We scrolled but we're still at top, so trigger query refresh as fallback
        switch (tabName) {
          case 'Challenge':
            queryClient.invalidateQueries({
              queryKey: queryKeys.leaguePrompt(currentLeagueId)
            });
            break;
          case 'Results':
            queryClient.invalidateQueries({
              queryKey: queryKeys.leagueRounds(currentLeagueId)
            });
            break;
          case 'Standings':
            queryClient.invalidateQueries({
              queryKey: queryKeys.league(currentLeagueId)
            });
            break;
          case 'League':
            queryClient.invalidateQueries({
              queryKey: queryKeys.leagueSettings(currentLeagueId)
            });
            break;
        }
      }
    } else {
      // Navigate immediately to new tab - prioritize speed over anything else
      router.push(href);
    }
  };

  // Don't show on auth pages or if not authenticated
  if (pathname?.startsWith('/auth/') || status !== 'authenticated') {
    return null;
  }

  const navItems = [
    {
      name: 'Challenge',
      href: currentLeagueId ? `/app/league/${currentLeagueId}` : '/app',
      icon: (active: boolean) => (
        <svg className={`w-6 h-6 ${active ? 'text-black' : 'text-white/70'}`} fill={active ? "white" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 1.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      name: 'Results',
      href: currentLeagueId ? `/app/league/${currentLeagueId}/rounds` : '/app/rounds',
      icon: (active: boolean) => (
        <svg className={`w-6 h-6 ${active ? 'text-black' : 'text-white/70'}`} fill={active ? "white" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 1.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    {
      name: 'Standings',
      href: currentLeagueId ? `/app/league/${currentLeagueId}/standings` : '/app/standings',
      icon: (active: boolean) => (
        <svg className={`w-6 h-6 ${active ? 'text-black' : 'text-white/70'}`} fill={active ? "white" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 1.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 13h4v7H4v-7zM10 8h4v12h-4V8zM16 16h4v4h-4v-4z" />
        </svg>
      )
    },
    {
      name: 'Chat',
      href: currentLeagueId ? `/app/league/${currentLeagueId}/chat` : '/app/chat',
      icon: (active: boolean) => (
        <svg className={`w-6 h-6 ${active ? 'text-black' : 'text-white/70'}`} fill={active ? "white" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 1.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      name: 'League',
      href: currentLeagueId ? `/app/league/${currentLeagueId}/league-settings` : '/app/league-settings',
      icon: (active: boolean) => (
        <svg className={`w-6 h-6 ${active ? 'text-black' : 'text-white/70'}`} fill={active ? "white" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 1.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-app-bg border-t border-app-border">
      <div className="flex items-center py-1 px-1 pb-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
                         (item.name === 'Challenge' && currentLeagueId && pathname === `/app/league/${currentLeagueId}`) ||
                         (item.name === 'Results' && pathname?.includes('/rounds')) ||
                         (item.name === 'Standings' && pathname?.includes('/standings')) ||
                         (item.name === 'Chat' && pathname?.includes('/chat')) ||
                         (item.name === 'League' && pathname?.includes('/league-settings'));

          // Determine notification state for this tab
          const showNotification = (() => {
            switch (item.name) {
              case 'Challenge':
                return challengeNotification;
              case 'Results':
                return resultsNotification;
              case 'Chat':
                return chatNotification;
              default:
                return false;
            }
          })();

          return (
            <button
              key={item.name}
              onClick={(e) => handleTabClick(item.href, !!isActive, item.name, e)}
              className="flex flex-col items-center py-2 px-0.5 transition-all duration-200 flex-1 select-none touch-manipulation active:scale-95 relative tap-highlight-transparent"
            >
              <div className="relative">
                {item.icon(!!isActive)}
                <NotificationDot show={showNotification} size="sm" />
              </div>
              <span className={`text-xs mt-1 select-none transition-all duration-200 ${isActive ? 'text-white font-bold' : 'text-white/70 font-medium'}`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

export default BottomNavigation;