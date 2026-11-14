import { DAILY_VERSES } from '../data/scripture';
import {
  EncouragingNotification,
  FocusTopic,
  ReminderSettings,
} from '../types/bible';
import { getRankInfo } from './gamification';

export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return window.Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await window.Notification.requestPermission();
    return result;
  } catch {
    return window.Notification.permission;
  }
}

export function dispatchBrowserNotification(title: string, body: string): boolean {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    window.Notification.permission !== 'granted'
  ) {
    return false;
  }
  try {
    new window.Notification(title, {
      body,
      tag: 'selah-daily-encouragement',
    });
    return true;
  } catch {
    return false;
  }
}

export function buildPersonalizedEncouragement(params: {
  name: string;
  streak: number;
  xp: number;
  completedToday: boolean;
  focusTopics: FocusTopic[];
  tone: ReminderSettings['tone'];
}): Omit<EncouragingNotification, 'id' | 'createdAt' | 'read'> {
  const { name, streak, xp, completedToday, focusTopics, tone } = params;
  const greetingName = name.trim() ? name.trim() : 'friend';
  const rank = getRankInfo(xp);

  const matching = DAILY_VERSES.filter((v) =>
    focusTopics.length > 0 ? focusTopics.includes(v.topic) : true
  );
  const verse = matching[Math.floor(Math.random() * matching.length)] ?? DAILY_VERSES[0];

  if (completedToday) {
    const xpRemaining = rank.nextXp ? rank.nextXp - xp : 0;
    const rankLine = rank.nextRankName
      ? `You are ${xpRemaining} XP from ${rank.nextRankName}.`
      : `You stand at ${rank.name} rank.`;

    return {
      title:
        tone === 'energizing'
          ? `Day ${streak} locked in, ${greetingName}`
          : `Well done today, ${greetingName}`,
      message: `${verse.encouragement} ${rankLine}`,
      verseReference: verse.reference,
      type: 'encouragement',
    };
  }

  if (streak > 0) {
    const streakLine =
      tone === 'gentle'
        ? `Your ${streak}-day rhythm is waiting whenever you have two quiet minutes.`
        : tone === 'energizing'
        ? `Keep your ${streak}-day streak alive—one short passage moves you closer to your next milestone.`
        : `Pause for a breath of Scripture today to carry forward your ${streak}-day habit.`;

    return {
      title: `A quiet word for Day ${streak + 1}`,
      message: `${streakLine} "${verse.web.slice(0, 96)}${verse.web.length > 96 ? '...' : ''}"`,
      verseReference: verse.reference,
      type: 'reminder',
    };
  }

  return {
    title: `Begin softly today, ${greetingName}`,
    message: `A single verse is enough to start a steady daily habit. ${verse.encouragement}`,
    verseReference: verse.reference,
    type: 'encouragement',
  };
}
