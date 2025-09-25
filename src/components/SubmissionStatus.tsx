'use client';

import { useSubmissionStatsQuery } from '@/hooks/queries/useSubmissionStatsQuery';
import ProfileAvatar from './ProfileAvatar';

interface SubmissionStatusProps {
  leagueId: string;
  className?: string;
}

export default function SubmissionStatus({ leagueId, className = '' }: SubmissionStatusProps) {
  const { data: stats, isLoading, error } = useSubmissionStatsQuery(leagueId);

  if (isLoading) {
    return (
      <div className={className}>
        <div className="animate-pulse">
          <div className="h-4 bg-app-surface-light rounded w-32 mb-2"></div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-8 h-8 bg-app-surface-light rounded-full"></div>
              ))}
            </div>
            <div className="h-4 bg-app-surface-light rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats || !stats.hasActiveChallenge) {
    return null;
  }

  if (stats.submissionCount === 0) {
    return (
      <div className={className}>
        <div className="text-center">
          <div className="text-sm text-app-text-secondary">
            <span className="text-app-text-secondary">0</span>
            {' of '}
            <span className="text-app-text-secondary">{stats.totalMembers}</span>
            {' submitted'}
          </div>
          <div className="text-xs text-app-text-muted mt-1">
            Be the first to submit!
          </div>
        </div>
      </div>
    );
  }

  const remainingCount = Math.max(0, stats.submissionCount - stats.submitters.length);

  return (
    <div className={className}>
      <div className="flex items-center justify-center gap-3">
        <div className="flex -space-x-2">
          {stats.submitters.map((submitter) => (
            <div key={submitter.id} className="relative">
              <ProfileAvatar
                username={submitter.user.username}
                profilePhoto={submitter.user.profilePhoto}
                size="sm"
                className="ring-2 ring-app-surface"
              />
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="w-8 h-8 bg-app-surface-light border-2 border-app-surface rounded-full flex items-center justify-center ring-1 ring-app-border-light">
              <span className="text-xs font-medium text-app-text-muted">
                +{remainingCount}
              </span>
            </div>
          )}
        </div>
        <div className="text-sm text-app-text-secondary mt-1">
          <span className="text-app-text-secondary">{stats.submissionCount}</span>
          {' of '}
          <span className="text-app-text-secondary">{stats.totalMembers}</span>
          {' submitted'}
        </div>
      </div>

    </div>
  );
}