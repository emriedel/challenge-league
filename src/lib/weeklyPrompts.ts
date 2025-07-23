// Weekly prompt cycle utilities

export function getWeeklyPromptDates(date: Date = new Date()) {
  // Get the most recent Saturday at 12 PM PT (or this Saturday if it's Saturday and before 12 PM PT)
  const now = new Date(date);
  
  // Convert to PT (UTC-8 or UTC-7 depending on DST)
  const ptOffset = getPacificTimeOffset(now);
  const nowPT = new Date(now.getTime() + ptOffset * 60 * 60 * 1000);
  
  // Find this Saturday at 12 PM PT
  const dayOfWeek = nowPT.getDay(); // 0 = Sunday, 6 = Saturday
  const daysUntilSaturday = (6 - dayOfWeek) % 7;
  
  const thisSaturday = new Date(nowPT);
  thisSaturday.setDate(nowPT.getDate() + daysUntilSaturday);
  thisSaturday.setHours(12, 0, 0, 0);
  
  // If today is Saturday and it's before 12 PM PT, use this Saturday
  // Otherwise, use next Saturday
  let weekStart: Date;
  if (dayOfWeek === 6 && nowPT.getHours() < 12) {
    weekStart = thisSaturday;
  } else if (daysUntilSaturday === 0) {
    // It's Saturday after 12 PM, use next Saturday
    weekStart = new Date(thisSaturday);
    weekStart.setDate(thisSaturday.getDate() + 7);
  } else {
    weekStart = thisSaturday;
  }
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  // Convert back to UTC for database storage
  const utcWeekStart = new Date(weekStart.getTime() - ptOffset * 60 * 60 * 1000);
  const utcWeekEnd = new Date(weekEnd.getTime() - ptOffset * 60 * 60 * 1000);
  
  return {
    weekStart: utcWeekStart,
    weekEnd: utcWeekEnd,
  };
}

export function getPacificTimeOffset(date: Date): number {
  // Simple DST calculation for Pacific Time
  // This is a simplified version - in production you'd use a proper timezone library
  const year = date.getFullYear();
  const march = new Date(year, 2, 1); // March 1st
  const november = new Date(year, 10, 1); // November 1st
  
  // Find second Sunday in March (DST start)
  march.setDate(1);
  const dstStart = new Date(march);
  dstStart.setDate(8 + (7 - march.getDay()) % 7);
  
  // Find first Sunday in November (DST end)
  november.setDate(1);
  const dstEnd = new Date(november);
  dstEnd.setDate(1 + (7 - november.getDay()) % 7);
  
  const isDST = date >= dstStart && date < dstEnd;
  return isDST ? -7 : -8; // UTC-7 during DST, UTC-8 during standard time
}

export function isSubmissionWindowOpen(prompt: { weekStart: Date; weekEnd: Date }): boolean {
  const now = new Date();
  return now >= prompt.weekStart && now < prompt.weekEnd;
}

export function getTimeUntilSubmissionDeadline(prompt: { weekEnd: Date }): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
} {
  const now = new Date();
  const deadline = new Date(prompt.weekEnd);
  const diff = deadline.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, isExpired: false };
}