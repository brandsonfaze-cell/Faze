import { useCallback, useEffect, useState } from 'react';
import {
  BibleAppState,
  DailyGoal,
  EncouragingNotification,
  FocusTopic,
  ReminderSettings,
  Translation,
} from '../types/bible';
import {
  addDays,
  calculateStreakStats,
  computeAchievements,
  formatLocalDate,
  getRankInfo,
} from '../utils/gamification';
import {
  buildPersonalizedEncouragement,
  dispatchBrowserNotification,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from '../utils/notifications';

const STORAGE_KEY = 'selah_bible_companion_v1';

function createInitialState(): BibleAppState {
  const today = formatLocalDate();
  return {
    preferences: {
      name: '',
      focusTopics: ['peace', 'wisdom'],
      translation: 'WEB',
      dailyGoal: 'chapter',
      fontSize: 'md',
      theme: 'light',
      redLetterEnabled: true,
    },
    readingLog: {
      completedDates: [],
      graceShieldDates: [],
      completedChapterIds: [],
      memorizedVerseIds: [],
      xp: 0,
      graceShields: 1, // One starting Grace Shield so learners feel encouraged from day one
      totalMinutesRead: 0,
    },
    journalEntries: [],
    highlights: {},
    notifications: [
      {
        id: 'welcome-1',
        title: 'Welcome to your daily rhythm',
        message:
          'You begin with 1 Streak Grace Shield. Read a verse or chapter today to spark your first milestone and earn +50 XP.',
        verseReference: 'Psalm 119:105',
        type: 'encouragement',
        createdAt: `${today}T08:00:00`,
        read: false,
      },
      {
        id: 'welcome-2',
        title: 'Personalized for Peace & Wisdom',
        message:
          'Your daily passages are tuned to your chosen focus themes. You can adjust topics, translation, and reminder hours anytime.',
        verseReference: 'Proverbs 3:5–6',
        type: 'reminder',
        createdAt: `${today}T08:05:00`,
        read: false,
      },
    ],
    reminders: {
      enabled: true,
      time: '08:00',
      tone: 'gentle',
      browserPermission: getBrowserNotificationPermission(),
      lastTriggeredDate: null,
    },
  };
}

function loadState(): BibleAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as BibleAppState;
    return {
      ...createInitialState(),
      ...parsed,
      reminders: {
        ...createInitialState().reminders,
        ...(parsed.reminders || {}),
        browserPermission: getBrowserNotificationPermission(),
      },
    };
  } catch {
    return createInitialState();
  }
}

export interface ActiveToast {
  id: string;
  title: string;
  message: string;
  xpDelta?: number;
}

export function useBibleProgress() {
  const [state, setState] = useState<BibleAppState>(() => loadState());
  const [activeToast, setActiveToast] = useState<ActiveToast | null>(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  // Apply light/dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (state.preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.preferences.theme]);

  const showToast = useCallback((toast: Omit<ActiveToast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setActiveToast({ ...toast, id });
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = window.setTimeout(() => {
      setActiveToast(null);
    }, 5500);
    return () => window.clearTimeout(timer);
  }, [activeToast]);

  // Scheduled reminder check every 30s while app is open
  useEffect(() => {
    if (!state.reminders.enabled) return;

    const checkReminder = () => {
      const now = new Date();
      const today = formatLocalDate(now);
      if (state.reminders.lastTriggeredDate === today) return;
      if (state.readingLog.completedDates.includes(today)) return;

      const [targetHour, targetMin] = state.reminders.time.split(':').map(Number);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const targetMinutes = (targetHour || 8) * 60 + (targetMin || 0);

      if (currentMinutes >= targetMinutes) {
        const streakStats = calculateStreakStats(
          state.readingLog.completedDates,
          state.readingLog.graceShieldDates,
          today
        );
        const payload = buildPersonalizedEncouragement({
          name: state.preferences.name,
          streak: streakStats.currentStreak,
          xp: state.readingLog.xp,
          completedToday: false,
          focusTopics: state.preferences.focusTopics,
          tone: state.reminders.tone,
        });

        const newNotif: EncouragingNotification = {
          ...payload,
          id: `rem-${Date.now()}`,
          createdAt: new Date().toISOString(),
          read: false,
        };

        dispatchBrowserNotification(newNotif.title, newNotif.message);
        showToast({ title: newNotif.title, message: newNotif.message });

        setState((prev) => ({
          ...prev,
          notifications: [newNotif, ...prev.notifications].slice(0, 30),
          reminders: {
            ...prev.reminders,
            lastTriggeredDate: today,
          },
        }));
      }
    };

    checkReminder();
    const interval = window.setInterval(checkReminder, 30000);
    return () => window.clearInterval(interval);
  }, [
    state.reminders.enabled,
    state.reminders.time,
    state.reminders.lastTriggeredDate,
    state.reminders.tone,
    state.readingLog.completedDates,
    state.readingLog.graceShieldDates,
    state.readingLog.xp,
    state.preferences.name,
    state.preferences.focusTopics,
    showToast,
  ]);

  const applyAchievementsAndNotify = (
    prevState: BibleAppState,
    nextState: BibleAppState
  ): { finalState: BibleAppState; bonusXp: number; newlyUnlocked: string[] } => {
    const prevUnlocked = new Set(
      computeAchievements(prevState)
        .filter((a) => a.unlocked)
        .map((a) => a.id)
    );
    const nextAchievements = computeAchievements(nextState);
    const newlyUnlockedList = nextAchievements.filter(
      (a) => a.unlocked && !prevUnlocked.has(a.id)
    );

    if (newlyUnlockedList.length === 0) {
      return { finalState: nextState, bonusXp: 0, newlyUnlocked: [] };
    }

    const bonusXp = newlyUnlockedList.reduce((sum, a) => sum + a.xpBonus, 0);
    const extraShield = newlyUnlockedList.some((a) => a.id === 'week-of-light') ? 1 : 0;

    const milestoneNotifs: EncouragingNotification[] = newlyUnlockedList.map((ach) => ({
      id: `ach-${ach.id}-${Date.now()}`,
      title: `Milestone unlocked: ${ach.title}`,
      message: `${ach.description} (+${ach.xpBonus} XP${extraShield ? ' & +1 Grace Shield' : ''})`,
      type: 'milestone',
      createdAt: new Date().toISOString(),
      read: false,
    }));

    return {
      finalState: {
        ...nextState,
        readingLog: {
          ...nextState.readingLog,
          xp: nextState.readingLog.xp + bonusXp,
          graceShields: nextState.readingLog.graceShields + extraShield,
        },
        notifications: [...milestoneNotifs, ...nextState.notifications].slice(0, 30),
      },
      bonusXp,
      newlyUnlocked: newlyUnlockedList.map((a) => a.title),
    };
  };

  const completeDailyReading = useCallback(
    (chapterId?: string, minutesSpent: number = 3) => {
      const today = formatLocalDate();
      let toastInfo: Omit<ActiveToast, 'id'> | null = null;

      setState((prev) => {
        const alreadyDoneToday = prev.readingLog.completedDates.includes(today);
        const isNewChapter =
          chapterId && !prev.readingLog.completedChapterIds.includes(chapterId);

        if (alreadyDoneToday && !isNewChapter) {
          toastInfo = {
            title: 'Already logged for today',
            message: 'Your daily streak is secure. Keep exploring any chapter or add a reflection.',
          };
          return prev;
        }

        const prevRank = getRankInfo(prev.readingLog.xp);
        const streakStats = calculateStreakStats(
          prev.readingLog.completedDates,
          prev.readingLog.graceShieldDates,
          today
        );

        let xpEarned = 0;
        if (!alreadyDoneToday) {
          // Base daily XP + small streak encouragement bonus (capped)
          xpEarned += 50 + Math.min(streakStats.currentStreak * 5, 35);
        }
        if (isNewChapter) {
          xpEarned += alreadyDoneToday ? 40 : 15;
        }

        const nextDates = alreadyDoneToday
          ? prev.readingLog.completedDates
          : [...prev.readingLog.completedDates, today];

        const nextChapters =
          chapterId && !prev.readingLog.completedChapterIds.includes(chapterId)
            ? [...prev.readingLog.completedChapterIds, chapterId]
            : prev.readingLog.completedChapterIds;

        const nextStreakStats = calculateStreakStats(
          nextDates,
          prev.readingLog.graceShieldDates,
          today
        );

        const nextXp = prev.readingLog.xp + xpEarned;
        const nextRank = getRankInfo(nextXp);

        const encouragement = buildPersonalizedEncouragement({
          name: prev.preferences.name,
          streak: nextStreakStats.currentStreak,
          xp: nextXp,
          completedToday: true,
          focusTopics: prev.preferences.focusTopics,
          tone: prev.reminders.tone,
        });

        const newNotifications: EncouragingNotification[] = !alreadyDoneToday
          ? [
              {
                ...encouragement,
                id: `done-${Date.now()}`,
                createdAt: new Date().toISOString(),
                read: false,
              },
              ...prev.notifications,
            ]
          : prev.notifications;

        const draft: BibleAppState = {
          ...prev,
          readingLog: {
            ...prev.readingLog,
            completedDates: nextDates,
            completedChapterIds: nextChapters,
            xp: nextXp,
            totalMinutesRead: prev.readingLog.totalMinutesRead + minutesSpent,
          },
          notifications: newNotifications.slice(0, 30),
        };

        const { finalState, bonusXp, newlyUnlocked } = applyAchievementsAndNotify(prev, draft);
        const totalXpGained = xpEarned + bonusXp;

        const rankUpMsg =
          nextRank.name !== prevRank.name
            ? ` You ascended to ${nextRank.name} rank.`
            : '';
        const milestoneMsg =
          newlyUnlocked.length > 0
            ? ` Unlocked: ${newlyUnlocked.join(', ')}.`
            : '';

        toastInfo = {
          title: !alreadyDoneToday
            ? `Day ${nextStreakStats.currentStreak} reading complete`
            : 'Chapter completed',
          message: `${encouragement.message}${rankUpMsg}${milestoneMsg}`,
          xpDelta: totalXpGained,
        };

        return finalState;
      });

      if (toastInfo) {
        showToast(toastInfo);
      }
    },
    [showToast]
  );

  const saveJournalReflection = useCallback(
    (params: { reference: string; chapterId: string; note: string }) => {
      const trimmed = params.note.trim();
      if (!trimmed) return;
      const today = formatLocalDate();
      let earnedXp = 0;

      setState((prev) => {
        const entry = {
          id: `note-${Date.now()}`,
          date: today,
          reference: params.reference,
          chapterId: params.chapterId,
          note: trimmed,
          createdAt: new Date().toISOString(),
        };
        earnedXp = 25;
        const draft: BibleAppState = {
          ...prev,
          journalEntries: [entry, ...prev.journalEntries],
          readingLog: {
            ...prev.readingLog,
            xp: prev.readingLog.xp + earnedXp,
          },
        };
        const { finalState, bonusXp } = applyAchievementsAndNotify(prev, draft);
        earnedXp += bonusXp;
        return finalState;
      });

      showToast({
        title: 'Reflection saved',
        message: 'Your personal study note has been preserved in your Progress journal.',
        xpDelta: earnedXp || 25,
      });
    },
    [showToast]
  );

  const toggleHighlightOrBookmark = useCallback(
    (params: {
      chapterId: string;
      reference: string;
      verseNumber: number;
      text: string;
      mode: 'highlight' | 'bookmark';
    }) => {
      const key = `${params.chapterId}:${params.verseNumber}`;
      let toastPayload: Omit<ActiveToast, 'id'> | null = null;

      setState((prev) => {
        const existing = prev.highlights[key];
        const nextHighlighted =
          params.mode === 'highlight' ? !(existing?.highlighted ?? false) : existing?.highlighted ?? false;
        const nextBookmarked =
          params.mode === 'bookmark' ? !(existing?.bookmarked ?? false) : existing?.bookmarked ?? false;

        const nextHighlights = { ...prev.highlights };
        let xpGain = 0;

        if (!nextHighlighted && !nextBookmarked) {
          delete nextHighlights[key];
        } else {
          if (!existing) {
            xpGain = 10;
          }
          nextHighlights[key] = {
            key,
            chapterId: params.chapterId,
            reference: params.reference,
            verseNumber: params.verseNumber,
            text: params.text,
            highlighted: nextHighlighted,
            bookmarked: nextBookmarked,
            savedAt: existing?.savedAt ?? new Date().toISOString(),
          };
        }

        const draft: BibleAppState = {
          ...prev,
          highlights: nextHighlights,
          readingLog: {
            ...prev.readingLog,
            xp: prev.readingLog.xp + xpGain,
          },
        };

        const { finalState, bonusXp } = applyAchievementsAndNotify(prev, draft);
        if (xpGain > 0) {
          toastPayload = {
            title: params.mode === 'bookmark' ? 'Verse saved to treasury' : 'Verse highlighted',
            message: `${params.reference} added to your saved Scripture collection.`,
            xpDelta: xpGain + bonusXp,
          };
        }
        return finalState;
      });

      if (toastPayload) {
        showToast(toastPayload);
      }
    },
    [showToast]
  );

  const completeVerseMemory = useCallback(
    (verseId: string, reference: string) => {
      let gained = 0;
      setState((prev) => {
        const alreadyMemorized = prev.readingLog.memorizedVerseIds.includes(verseId);
        gained = alreadyMemorized ? 5 : 20;
        const nextMemorized = alreadyMemorized
          ? prev.readingLog.memorizedVerseIds
          : [...prev.readingLog.memorizedVerseIds, verseId];

        const draft: BibleAppState = {
          ...prev,
          readingLog: {
            ...prev.readingLog,
            memorizedVerseIds: nextMemorized,
            xp: prev.readingLog.xp + gained,
          },
        };
        const { finalState, bonusXp } = applyAchievementsAndNotify(prev, draft);
        gained += bonusXp;
        return finalState;
      });

      showToast({
        title: 'Selah recall complete',
        message: `You practiced ${reference}. Returning to a verse deepens peace all week.`,
        xpDelta: gained || 20,
      });
    },
    [showToast]
  );

  const applyGraceShieldToYesterday = useCallback(() => {
    const yesterday = addDays(formatLocalDate(), -1);
    let resultMessage: Omit<ActiveToast, 'id'> | null = null;

    setState((prev) => {
      if (prev.readingLog.graceShields <= 0) {
        resultMessage = {
          title: 'No Grace Shields available',
          message: 'Complete a 7-day reading rhythm to earn your next Streak Grace Shield.',
        };
        return prev;
      }
      if (
        prev.readingLog.completedDates.includes(yesterday) ||
        prev.readingLog.graceShieldDates.includes(yesterday)
      ) {
        resultMessage = {
          title: 'Yesterday is already covered',
          message: 'Your reading streak has no gap yesterday.',
        };
        return prev;
      }

      const notif: EncouragingNotification = {
        id: `grace-${Date.now()}`,
        title: 'Grace Shield applied',
        message: 'Yesterday was covered by your Streak Grace Shield. God’s mercies are new every morning.',
        verseReference: 'Lamentations 3:22–23',
        type: 'grace',
        createdAt: new Date().toISOString(),
        read: false,
      };

      resultMessage = {
        title: 'Streak preserved with Grace',
        message: 'Yesterday is covered. Continue today with zero guilt.',
      };

      return {
        ...prev,
        readingLog: {
          ...prev.readingLog,
          graceShields: prev.readingLog.graceShields - 1,
          graceShieldDates: [...prev.readingLog.graceShieldDates, yesterday],
        },
        notifications: [notif, ...prev.notifications].slice(0, 30),
      };
    });

    if (resultMessage) {
      showToast(resultMessage);
    }
  }, [showToast]);

  const updatePreferences = useCallback(
    (patch: Partial<BibleAppState['preferences']>) => {
      setState((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          ...patch,
        },
      }));
    },
    []
  );

  const toggleFocusTopic = useCallback((topic: FocusTopic) => {
    setState((prev) => {
      const exists = prev.preferences.focusTopics.includes(topic);
      const next = exists
        ? prev.preferences.focusTopics.filter((t) => t !== topic)
        : [...prev.preferences.focusTopics, topic];
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          focusTopics: next.length > 0 ? next : [topic],
        },
      };
    });
  }, []);

  const updateReminderSettings = useCallback((patch: Partial<ReminderSettings>) => {
    setState((prev) => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        ...patch,
      },
    }));
  }, []);

  const enableBrowserNotifications = useCallback(async () => {
    const permission = await requestBrowserNotificationPermission();
    setState((prev) => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        browserPermission: permission,
      },
    }));

    if (permission === 'granted') {
      dispatchBrowserNotification(
        'Selah reminders active',
        'You will receive gentle daily Scripture encouragement at your scheduled hour.'
      );
      showToast({
        title: 'Browser notifications enabled',
        message: 'A confirmation alert was sent to your device.',
      });
    } else if (permission === 'denied') {
      showToast({
        title: 'Browser notifications blocked',
        message: 'Enable notifications in your browser site settings anytime. In-app reminders remain active.',
      });
    }
  }, [showToast]);

  const sendEncouragementNow = useCallback(() => {
    const today = formatLocalDate();
    const streakStats = calculateStreakStats(
      state.readingLog.completedDates,
      state.readingLog.graceShieldDates,
      today
    );
    const payload = buildPersonalizedEncouragement({
      name: state.preferences.name,
      streak: streakStats.currentStreak,
      xp: state.readingLog.xp,
      completedToday: streakStats.completedToday,
      focusTopics: state.preferences.focusTopics,
      tone: state.reminders.tone,
    });

    const newNotif: EncouragingNotification = {
      ...payload,
      id: `enc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };

    dispatchBrowserNotification(newNotif.title, newNotif.message);
    showToast({ title: newNotif.title, message: newNotif.message });

    setState((prev) => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications].slice(0, 30),
    }));
  }, [state, showToast]);

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const exportProgressJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selah-bible-progress-${formatLocalDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({
      title: 'Progress exported',
      message: 'Your streaks, highlights, and journal notes were saved as a JSON backup.',
    });
  }, [state, showToast]);

  const importProgressJson = useCallback(
    (jsonText: string) => {
      try {
        const parsed = JSON.parse(jsonText) as BibleAppState;
        if (!parsed.readingLog || !parsed.preferences) {
          throw new Error('Invalid backup format');
        }
        setState({
          ...createInitialState(),
          ...parsed,
          reminders: {
            ...createInitialState().reminders,
            ...(parsed.reminders || {}),
            browserPermission: getBrowserNotificationPermission(),
          },
        });
        showToast({
          title: 'Backup restored',
          message: 'Your reading streaks, saved verses, and reflections have been restored.',
        });
      } catch {
        showToast({
          title: 'Could not import file',
          message: 'Please select a valid Selah JSON backup file.',
        });
      }
    },
    [showToast]
  );

  const setTranslation = useCallback(
    (translation: Translation) => updatePreferences({ translation }),
    [updatePreferences]
  );

  const setDailyGoal = useCallback(
    (dailyGoal: DailyGoal) => updatePreferences({ dailyGoal }),
    [updatePreferences]
  );

  return {
    state,
    activeToast,
    showToast,
    dismissToast,
    completeDailyReading,
    saveJournalReflection,
    toggleHighlightOrBookmark,
    completeVerseMemory,
    applyGraceShieldToYesterday,
    updatePreferences,
    toggleFocusTopic,
    updateReminderSettings,
    enableBrowserNotifications,
    sendEncouragementNow,
    markNotificationRead,
    markAllNotificationsRead,
    exportProgressJson,
    importProgressJson,
    setTranslation,
    setDailyGoal,
  };
}
