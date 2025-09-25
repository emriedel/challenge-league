'use client';

import { useState, useEffect } from 'react';
import { getTimeUntilPhaseEnd, getRealisticPhaseEndTime } from '@/lib/phaseCalculations';
import type { PromptWithPhase, LeagueSettings } from '@/lib/phaseCalculations';

interface CountdownTimerProps {
  prompt: PromptWithPhase;
  leagueSettings?: LeagueSettings;
  className?: string;
  showDeadlineDate?: boolean;
}

export default function CountdownTimer({
  prompt,
  leagueSettings,
  className = '',
  showDeadlineDate = false
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeUntilPhaseEnd(prompt, leagueSettings));

  useEffect(() => {
    const updateTimer = () => {
      setTimeLeft(getTimeUntilPhaseEnd(prompt, leagueSettings));
    };

    // Update immediately
    updateTimer();

    // Update every minute
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [prompt, leagueSettings]);

  const formatTime = () => {
    const parts = [];

    if (timeLeft.days > 0) {
      parts.push(`${timeLeft.days}d`);
    }
    if (timeLeft.hours > 0) {
      parts.push(`${timeLeft.hours}h`);
    }
    if (timeLeft.minutes > 0 || parts.length === 0) {
      parts.push(`${timeLeft.minutes}m`);
    }

    return parts.join(' ');
  };

  const formatDeadlineDate = () => {
    const endTime = getRealisticPhaseEndTime(prompt, leagueSettings);
    if (!endTime) return 'TBD';

    return endTime.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const getUrgencyStyle = () => {
    if (timeLeft.isExpired) {
      return 'text-red-500';
    }

    const totalMinutes = timeLeft.days * 24 * 60 + timeLeft.hours * 60 + timeLeft.minutes;

    if (totalMinutes <= 60) { // Less than 1 hour
      return 'text-red-500';
    } else if (totalMinutes <= 360) { // Less than 6 hours
      return 'text-orange-500';
    } else if (totalMinutes <= 1440) { // Less than 1 day
      return 'text-yellow-500';
    } else {
      return 'text-[#3a8e8c]';
    }
  };

  if (timeLeft.isExpired) {
    return (
      <div className={`bg-app-surface border border-app-border rounded-lg p-6 text-center ${className}`}>
        <div className="text-app-text-secondary text-sm font-medium mb-2 tracking-wider uppercase">
          DEADLINE
        </div>
        <div className="text-red-500 text-3xl font-bold mb-2">
          Deadline passed
        </div>
        {showDeadlineDate && (
          <div className="text-app-text-secondary text-sm">
            {formatDeadlineDate()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-app-surface border border-app-border rounded-lg p-6 text-center ${className}`}>
      <div className="text-app-text-secondary text-sm font-medium mb-2 tracking-wider uppercase">
        DEADLINE
      </div>
      <div className={`text-3xl font-bold mb-2 ${getUrgencyStyle()}`}>
        {formatTime()}
      </div>
      {showDeadlineDate && (
        <div className="text-app-text-secondary text-sm">
          {formatDeadlineDate()}
        </div>
      )}
    </div>
  );
}