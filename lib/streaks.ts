export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getOffsetDateString(baseDateStr: string, offset: number): string {
  const date = new Date(baseDateStr + 'T12:00:00'); // Use noon to avoid timezone shift
  date.setDate(date.getDate() + offset);
  return getLocalDateString(date);
}

/**
 * Calculates current streak for a habit.
 * A streak is active if completed today, or completed yesterday (and today hasn't been ticked off yet).
 */
export function calculateCurrentStreak(completedDates: string[], todayStr: string): number {
  if (completedDates.length === 0) return 0;
  
  const datesSet = new Set(completedDates);
  let streak = 0;
  let checkDate = todayStr;

  if (datesSet.has(todayStr)) {
    streak = 1;
    checkDate = getOffsetDateString(todayStr, -1);
  } else {
    const yesterdayStr = getOffsetDateString(todayStr, -1);
    if (datesSet.has(yesterdayStr)) {
      streak = 1;
      checkDate = getOffsetDateString(yesterdayStr, -1);
    } else {
      return 0;
    }
  }

  while (datesSet.has(checkDate)) {
    streak++;
    checkDate = getOffsetDateString(checkDate, -1);
  }

  return streak;
}

/**
 * Calculates longest historical streak for a habit.
 */
export function calculateLongestStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  
  // Dedup and sort ascending
  const sorted = Array.from(new Set(completedDates)).sort();
  
  let maxStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    
    if (getOffsetDateString(prev, 1) === curr) {
      currentStreak++;
    } else {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 1;
    }
  }
  
  return Math.max(maxStreak, currentStreak);
}
