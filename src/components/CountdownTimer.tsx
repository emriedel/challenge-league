'use client';

import { useState, useEffect } from 'react';
import { getTimeUntilSubmissionDeadline } from '@/lib/weeklyPrompts';

interface CountdownTimerProps {
  weekEnd: string;
  className?: string;
}

export default function CountdownTimer({ weekEnd, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    isExpired: false,
  });

  useEffect(() => {
    const updateTimer = () => {
      const deadline = new Date(weekEnd);
      const time = getTimeUntilSubmissionDeadline({ weekEnd: deadline });
      setTimeLeft(time);
    };

    // Update immediately
    updateTimer();

    // Update every minute
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [weekEnd]);

  if (timeLeft.isExpired) {
    return (
      <div className={`text-red-600 font-medium ${className}`}>
        ⏰ Submission window closed
      </div>
    );
  }

  const formatTime = () => {
    const parts = [];
    
    if (timeLeft.days > 0) {
      parts.push(`${timeLeft.days} day${timeLeft.days !== 1 ? 's' : ''}`);
    }
    
    if (timeLeft.hours > 0) {
      parts.push(`${timeLeft.hours} hour${timeLeft.hours !== 1 ? 's' : ''}`);
    }
    
    if (timeLeft.minutes > 0 || (timeLeft.days === 0 && timeLeft.hours === 0)) {
      parts.push(`${timeLeft.minutes} minute${timeLeft.minutes !== 1 ? 's' : ''}`);
    }

    return parts.join(', ');
  };

  const getUrgencyClass = () => {
    if (timeLeft.days === 0 && timeLeft.hours < 2) {
      return 'text-red-600';
    } else if (timeLeft.days === 0 && timeLeft.hours < 12) {
      return 'text-orange-600';
    } else if (timeLeft.days < 2) {
      return 'text-yellow-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className={`font-medium ${getUrgencyClass()} ${className}`}>
      ⏰ {formatTime()} remaining
    </div>
  );
}