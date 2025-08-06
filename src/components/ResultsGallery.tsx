'use client';

import Link from 'next/link';
import Image from 'next/image';
import ProfileAvatar from './ProfileAvatar';
import { getRankIcon } from '@/lib/utils';
import type { ResultsGalleryProps } from '@/types/components';



export default function ResultsGallery({ responses, prompt, leagueId }: ResultsGalleryProps) {
  return (
    <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mx-2 sm:mx-0">
        <h2 className="text-xl font-semibold mb-2">Latest Completed Round</h2>
        <p className="text-gray-600 mb-4">{prompt?.text}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {responses.slice(0, 6).map((response) => (
            <div key={response.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="relative">
                <Image
                  src={response.imageUrl}
                  alt={response.caption}
                  width={400}
                  height={192}
                  className="w-full h-48 object-contain bg-gray-50"
                />
                {response.finalRank && response.finalRank <= 3 && (
                  <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded text-sm font-bold">
                    {getRankIcon(response.finalRank)}
                  </div>
                )}
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <ProfileAvatar 
                      username={response.user.username}
                      profilePhoto={response.user.profilePhoto}
                      size="sm"
                    />
                    <p className="font-medium text-gray-900">@{response.user.username}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-blue-600 font-medium">{response.totalPoints} pts</div>
                    <div className="text-gray-500">#{response.finalRank || '—'}</div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{response.caption}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link
            href={`/league/${leagueId}/results`}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            View All Completed Rounds →
          </Link>
        </div>
      </div>
    </div>
  );
}