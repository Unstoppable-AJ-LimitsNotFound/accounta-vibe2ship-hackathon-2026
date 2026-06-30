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
 * Calculates current streak for a habit, taking skipped dates into account.
 * A streak is active if completed or skipped today, or completed or skipped yesterday (and today hasn't been ticked off yet).
 * Skipped days do not increment the streak number, but they keep it alive.
 */
export function calculateCurrentStreak(
  completedDates: string[],
  skippedDatesOrToday: string[] | string,
  maybeTodayStr?: string
): number {
  let skippedDates: string[] = [];
  let todayStr = '';

  if (typeof skippedDatesOrToday === 'string') {
    todayStr = skippedDatesOrToday;
  } else {
    skippedDates = skippedDatesOrToday || [];
    todayStr = maybeTodayStr || '';
  }

  const completedSet = new Set(completedDates);
  const skippedSet = new Set(skippedDates);
  const isActive = (d: string) => completedSet.has(d) || skippedSet.has(d);

  if (!isActive(todayStr)) {
    const yesterdayStr = getOffsetDateString(todayStr, -1);
    if (!isActive(yesterdayStr)) {
      return 0;
    }
  }

  let checkDate = isActive(todayStr) ? todayStr : getOffsetDateString(todayStr, -1);
  let streak = 0;

  while (isActive(checkDate)) {
    if (completedSet.has(checkDate)) {
      streak++;
    }
    checkDate = getOffsetDateString(checkDate, -1);
  }

  return streak;
}

/**
 * Calculates longest historical streak for a habit, taking skipped dates into account.
 * Contiguous blocks of completed or skipped days keep the streak alive, but only completed days are counted.
 */
export function calculateLongestStreak(
  completedDates: string[],
  skippedDates?: string[]
): number {
  const completedSet = new Set(completedDates);
  const skippedSet = new Set(skippedDates || []);
  
  const allActiveList = Array.from(new Set([...completedDates, ...(skippedDates || [])])).sort();
  if (allActiveList.length === 0) return 0;

  let maxStreak = 0;
  let currentBlock: string[] = [];

  for (let i = 0; i < allActiveList.length; i++) {
    const curr = allActiveList[i];
    if (currentBlock.length === 0) {
      currentBlock.push(curr);
    } else {
      const prev = currentBlock[currentBlock.length - 1];
      if (getOffsetDateString(prev, 1) === curr) {
        currentBlock.push(curr);
      } else {
        // End of contiguous block, calculate completed count
        const completedCount = currentBlock.filter(d => completedSet.has(d)).length;
        maxStreak = Math.max(maxStreak, completedCount);
        currentBlock = [curr];
      }
    }
  }

  if (currentBlock.length > 0) {
    const completedCount = currentBlock.filter(d => completedSet.has(d)).length;
    maxStreak = Math.max(maxStreak, completedCount);
  }

  return maxStreak;
}
