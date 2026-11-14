import { Achievement, BibleAppState, RankInfo } from '../types/bible';

export const RANKS: { name: string; minXp: number }[] = [
  { name: 'Seeker', minXp: 0 },
  { name: 'Listener', minXp: 100 },
  { name: 'Pilgrim', minXp: 250 },
  { name: 'Steward', minXp: 500 },
  { name: 'Scribe', minXp: 850 },
  { name: 'Watchman', minXp: 1300 },
  { name: 'Keeper of the Word', minXp: 2000 },
];

export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return formatLocalDate(date);
}

export function getRankInfo(xp: number): RankInfo {
  let current = RANKS[0];
  let next: { name: string; minXp: number } | null = RANKS[1] ?? null;

  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].minXp) {
      current = RANKS[i];
      next = RANKS[i + 1] ?? null;
    }
  }

  if (!next) {
    return {
      name: current.name,
      minXp: current.minXp,
      nextXp: null,
      nextRankName: null,
      progressPercent: 100,
    };
  }

  const span = next.minXp - current.minXp;
  const gained = xp - current.minXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((gained / span) * 100)));

  return {
    name: current.name,
    minXp: current.minXp,
    nextXp: next.minXp,
    nextRankName: next.name,
    progressPercent,
  };
}

export function calculateStreakStats(
  completedDates: string[],
  graceShieldDates: string[],
  todayStr: string = formatLocalDate()
): {
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  activeSet: Set<string>;
} {
  const completedSet = new Set(completedDates);
  const activeSet = new Set([...completedDates, ...graceShieldDates]);
  const completedToday = completedSet.has(todayStr);

  // Current streak counts backwards from today if active today, else from yesterday
  let currentStreak = 0;
  let cursor = activeSet.has(todayStr) ? todayStr : addDays(todayStr, -1);

  while (activeSet.has(cursor)) {
    currentStreak += 1;
    cursor = addDays(cursor, -1);
  }

  // Longest streak across all sorted active dates
  const sorted = Array.from(activeSet).sort();
  let longestStreak = 0;
  let running = 0;
  let prevDate: string | null = null;

  for (const d of sorted) {
    if (prevDate && addDays(prevDate, 1) === d) {
      running += 1;
    } else {
      running = 1;
    }
    if (running > longestStreak) {
      longestStreak = running;
    }
    prevDate = d;
  }

  return {
    currentStreak,
    longestStreak,
    completedToday,
    activeSet,
  };
}

export function getWeekRibbon(
  completedDates: string[],
  graceShieldDates: string[],
  todayStr: string = formatLocalDate()
): {
  date: string;
  dayShort: string;
  dayNum: string;
  status: 'completed' | 'grace' | 'today-pending' | 'missed' | 'future';
  isToday: boolean;
}[] {
  const [y, m, d] = todayStr.split('-').map(Number);
  const todayObj = new Date(y, m - 1, d);
  const dayOfWeek = todayObj.getDay(); // 0 Sun .. 6 Sat
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayStr = addDays(todayStr, mondayOffset);

  const completedSet = new Set(completedDates);
  const graceSet = new Set(graceShieldDates);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return Array.from({ length: 7 }, (_, idx) => {
    const date = addDays(mondayStr, idx);
    const dayNum = date.split('-')[2].replace(/^0/, '');
    const isToday = date === todayStr;

    let status: 'completed' | 'grace' | 'today-pending' | 'missed' | 'future';
    if (completedSet.has(date)) {
      status = 'completed';
    } else if (graceSet.has(date)) {
      status = 'grace';
    } else if (isToday) {
      status = 'today-pending';
    } else if (date > todayStr) {
      status = 'future';
    } else {
      status = 'missed';
    }

    return {
      date,
      dayShort: dayNames[idx],
      dayNum,
      status,
      isToday,
    };
  });
}

export function getHeatmapDays(
  completedDates: string[],
  graceShieldDates: string[],
  todayStr: string = formatLocalDate(),
  weeks: number = 12
): {
  date: string;
  level: 0 | 1 | 2;
  label: string;
  isToday: boolean;
}[] {
  const totalDays = weeks * 7;
  const startStr = addDays(todayStr, -(totalDays - 1));
  const completedSet = new Set(completedDates);
  const graceSet = new Set(graceShieldDates);

  return Array.from({ length: totalDays }, (_, idx) => {
    const date = addDays(startStr, idx);
    const level: 0 | 1 | 2 = completedSet.has(date) ? 2 : graceSet.has(date) ? 1 : 0;
    const statusText =
      level === 2 ? 'Reading completed' : level === 1 ? 'Grace shield preserved' : 'No reading logged';
    return {
      date,
      level,
      label: `${date}: ${statusText}`,
      isToday: date === todayStr,
    };
  });
}

export function computeAchievements(state: BibleAppState): Achievement[] {
  const { currentStreak, longestStreak } = calculateStreakStats(
    state.readingLog.completedDates,
    state.readingLog.graceShieldDates
  );
  const bestStreak = Math.max(currentStreak, longestStreak);
  const totalDays = state.readingLog.completedDates.length;
  const chaptersCount = state.readingLog.completedChapterIds.length;
  const notesCount = state.journalEntries.length;
  const savedCount = Object.values(state.highlights).filter(
    (h) => h.bookmarked || h.highlighted
  ).length;
  const memorizedCount = state.readingLog.memorizedVerseIds.length;
  const psalmsRead = state.readingLog.completedChapterIds.filter((id) =>
    id.startsWith('psalm-')
  ).length;

  return [
    {
      id: 'first-dawn',
      title: 'First Dawn',
      description: 'Complete your first daily Scripture reading.',
      criteriaLabel: '1 daily reading',
      xpBonus: 25,
      unlocked: totalDays >= 1,
      progress: Math.min(totalDays, 1),
      target: 1,
    },
    {
      id: 'three-day-rhythm',
      title: 'Steady Rhythm',
      description: 'Read Scripture for 3 consecutive days.',
      criteriaLabel: '3-day streak',
      xpBonus: 50,
      unlocked: bestStreak >= 3,
      progress: Math.min(bestStreak, 3),
      target: 3,
    },
    {
      id: 'week-of-light',
      title: 'Week of Light',
      description: 'Maintain a full 7-day reading streak and earn a Grace Shield.',
      criteriaLabel: '7-day streak',
      xpBonus: 100,
      unlocked: bestStreak >= 7,
      progress: Math.min(bestStreak, 7),
      target: 7,
    },
    {
      id: 'quiet-reflection',
      title: 'Quiet Scribe',
      description: 'Record 3 personal reflections on daily passages.',
      criteriaLabel: '3 journal notes',
      xpBonus: 60,
      unlocked: notesCount >= 3,
      progress: Math.min(notesCount, 3),
      target: 3,
    },
    {
      id: 'psalmist-heart',
      title: 'Psalmist’s Heart',
      description: 'Read 3 chapters from the Book of Psalms.',
      criteriaLabel: '3 Psalms read',
      xpBonus: 75,
      unlocked: psalmsRead >= 3,
      progress: Math.min(psalmsRead, 3),
      target: 3,
    },
    {
      id: 'treasured-word',
      title: 'Treasured Word',
      description: 'Highlight or bookmark 5 verses for future encouragement.',
      criteriaLabel: '5 saved verses',
      xpBonus: 50,
      unlocked: savedCount >= 5,
      progress: Math.min(savedCount, 5),
      target: 5,
    },
    {
      id: 'hidden-in-heart',
      title: 'Hidden in Heart',
      description: 'Complete 3 Selah verse recall memory practices.',
      criteriaLabel: '3 verses practiced',
      xpBonus: 75,
      unlocked: memorizedCount >= 3,
      progress: Math.min(memorizedCount, 3),
      target: 3,
    },
    {
      id: 'canon-explorer',
      title: 'Canonical Explorer',
      description: 'Read 6 distinct Bible chapters across the library.',
      criteriaLabel: '6 chapters read',
      xpBonus: 120,
      unlocked: chaptersCount >= 6,
      progress: Math.min(chaptersCount, 6),
      target: 6,
    },
  ];
}
