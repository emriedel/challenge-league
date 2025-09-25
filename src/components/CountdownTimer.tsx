'use client';

import { useState, useEffect } from 'react';
import { getTimeUntilPhaseEnd, getRealisticPhaseEndTime } from '@/lib/phaseCalculations';
import type { PromptWithPhase, LeagueSettings } from '@/lib/phaseCalculations';

interface CountdownTimerProps {
  prompt: PromptWithPhase;
  leagueSettings?: LeagueSettings;
  className?: string;
  showDeadlineDate?: boolean;
  deadlineLabel?: string;
}

export default function CountdownTimer({
  prompt,
  leagueSettings,
  className = '',
  showDeadlineDate = false,
  deadlineLabel = 'SUBMISSION DEADLINE'
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const endTime = getRealisticPhaseEndTime(prompt, leagueSettings);
    if (!endTime) {
      return { days: 0, hours: 0, minutes: 0, isExpired: true };
    }

    const now = new Date();
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, isExpired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, isExpired: false };
  });

  useEffect(() => {
    const updateTimer = () => {
      const endTime = getRealisticPhaseEndTime(prompt, leagueSettings);

      if (!endTime) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, isExpired: true });
        return;
      }

      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, minutes, isExpired: false });
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
      weekday: 'long',
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
          {deadlineLabel}
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
        {deadlineLabel}
      </div>
      <div className={`text-3xl font-bold mb-2 flex items-center justify-center gap-3 ${getUrgencyStyle()}`}>
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
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