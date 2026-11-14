export type FocusTopic =
  | 'peace'
  | 'wisdom'
  | 'gratitude'
  | 'strength'
  | 'grace'
  | 'gospels'
  | 'psalms';

export type Translation = 'WEB' | 'KJV';

export type DailyGoal = 'verse' | 'chapter' | 'ten_minutes';

export type AppTab = 'today' | 'scripture' | 'progress' | 'reminders';

export interface BibleVerse {
  number: number;
  web: string;
  kjv: string;
  isRedLetter?: boolean;
}

export interface ScriptureChapter {
  id: string;
  book: string;
  chapter: number;
  testament: 'Old Testament' | 'New Testament';
  title: string;
  summary: string;
  topics: FocusTopic[];
  readMinutes: number;
  reflectionPrompt: string;
  verses: BibleVerse[];
}

export interface DailyVerseEntry {
  id: string;
  reference: string;
  book: string;
  chapterId: string;
  verseNumber: number;
  topic: FocusTopic;
  web: string;
  kjv: string;
  isRedLetter?: boolean;
  encouragement: string;
  reflectionQuestion: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  reference: string;
  chapterId: string;
  note: string;
  createdAt: string;
}

export interface HighlightedVerse {
  key: string; // `${chapterId}:${verseNumber}`
  chapterId: string;
  reference: string;
  verseNumber: number;
  text: string;
  bookmarked: boolean;
  highlighted: boolean;
  savedAt: string;
}

export interface EncouragingNotification {
  id: string;
  title: string;
  message: string;
  verseReference?: string;
  type: 'encouragement' | 'milestone' | 'reminder' | 'grace';
  createdAt: string;
  read: boolean;
}

export interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:mm
  tone: 'gentle' | 'energizing' | 'reflective';
  browserPermission: NotificationPermission | 'unsupported';
  lastTriggeredDate: string | null;
}

export interface UserPreferences {
  name: string;
  focusTopics: FocusTopic[];
  translation: Translation;
  dailyGoal: DailyGoal;
  fontSize: 'sm' | 'md' | 'lg';
  theme: 'light' | 'dark';
  redLetterEnabled?: boolean;
}

export interface ReadingLog {
  completedDates: string[]; // YYYY-MM-DD
  graceShieldDates: string[]; // YYYY-MM-DD protected automatically or manually
  completedChapterIds: string[];
  memorizedVerseIds: string[];
  xp: number;
  graceShields: number;
  totalMinutesRead: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  criteriaLabel: string;
  xpBonus: number;
  unlocked: boolean;
  progress: number;
  target: number;
}

export interface RankInfo {
  name: string;
  minXp: number;
  nextXp: number | null;
  nextRankName: string | null;
  progressPercent: number;
}

export interface BibleAppState {
  preferences: UserPreferences;
  readingLog: ReadingLog;
  journalEntries: JournalEntry[];
  highlights: Record<string, HighlightedVerse>;
  notifications: EncouragingNotification[];
  reminders: ReminderSettings;
}
