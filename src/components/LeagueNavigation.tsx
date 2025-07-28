'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LeagueNavigationProps {
  leagueId: string;
  leagueName: string;
}

export default function LeagueNavigation({ leagueId, leagueName }: LeagueNavigationProps) {
  const pathname = usePathname();

  const tabs = [
    { id: 'home', name: 'League Home', href: `/league/${leagueId}` },
    { id: 'results', name: 'Latest Results', href: `/league/${leagueId}/results` },
    { id: 'leaderboard', name: 'Leaderboard', href: `/league/${leagueId}/leaderboard` },
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* League Header */}
        <div className="py-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏆 {leagueName}</h1>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex justify-center space-x-8" aria-label="League Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`${
                pathname === tab.href
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}