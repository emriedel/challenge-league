'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LeagueNavigationProps } from '@/types/components';


export default function LeagueNavigation({ leagueId, leagueName, isOwner }: LeagueNavigationProps) {
  const pathname = usePathname();

  const tabs = [
    { id: 'home', name: 'Current Challenge', href: `/league/${leagueId}` },
    { id: 'rounds', name: 'Challenge Results', href: `/league/${leagueId}/rounds` },
    { id: 'standings', name: 'Standings', href: `/league/${leagueId}/standings` },
    ...(isOwner ? [{ id: 'league-settings', name: 'League Settings', href: `/league/${leagueId}/league-settings` }] : []),
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation Tabs - Hidden on mobile since we use bottom navigation */}
        <nav className="hidden md:flex justify-center space-x-4 md:space-x-8 overflow-x-auto scrollbar-hide py-4" aria-label="League Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`${
                pathname === tab.href
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 md:px-2 border-b-2 font-medium text-sm transition-colors min-w-0 flex-shrink-0`}
            >
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">
                {tab.name === 'Current Challenge' ? 'Home' : 
                 tab.name === 'Challenge Results' ? 'Results' : 
                 tab.name === 'Standings' ? 'Standings' : 
                 tab.name === 'League Settings' ? 'Settings' : tab.name}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}