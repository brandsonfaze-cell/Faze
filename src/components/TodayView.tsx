import {
  Bookmark,
  Check,
  Copy,
  Flame,
  Highlighter,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FOCUS_TOPICS, getPersonalizedDailySelection } from '../data/scripture';
import { BibleAppState, FocusTopic, Translation } from '../types/bible';
import {
  addDays,
  calculateStreakStats,
  formatLocalDate,
  getRankInfo,
  getWeekRibbon,
} from '../utils/gamification';
import { getTopicInk } from '../utils/themeColors';
import { ResilientImage } from './ResilientImage';

interface TodayViewProps {
  state: BibleAppState;
  onCompleteReading: (chapterId?: string, minutesSpent?: number) => void;
  onSaveReflection: (params: { reference: string; chapterId: string; note: string }) => void;
  onToggleHighlightOrBookmark: (params: {
    chapterId: string;
    reference: string;
    verseNumber: number;
    text: string;
    mode: 'highlight' | 'bookmark';
  }) => void;
  onCompleteVerseMemory: (verseId: string, reference: string) => void;
  onApplyGraceShield: () => void;
  onToggleTopic: (topic: FocusTopic) => void;
  onSetTranslation: (translation: Translation) => void;
  onOpenChapterInReader: (chapterId: string) => void;
  onCopySuccess: (title: string, message: string) => void;
}

const HERO_IMAGE = '/src/assets/images/hero_sanctuary_morning_1794684004455.jpg';

export function TodayView({
  state,
  onCompleteReading,
  onSaveReflection,
  onToggleHighlightOrBookmark,
  onCompleteVerseMemory,
  onApplyGraceShield,
  onToggleTopic,
  onSetTranslation,
  onOpenChapterInReader,
  onCopySuccess,
}: TodayViewProps) {
  const todayStr = formatLocalDate();
  const yesterdayStr = addDays(todayStr, -1);

  const { verse, chapter } = useMemo(
    () => getPersonalizedDailySelection(state.preferences.focusTopics, todayStr),
    [state.preferences.focusTopics, todayStr]
  );

  const streakStats = useMemo(
    () =>
      calculateStreakStats(
        state.readingLog.completedDates,
        state.readingLog.graceShieldDates,
        todayStr
      ),
    [state.readingLog.completedDates, state.readingLog.graceShieldDates, todayStr]
  );

  const weekRibbon = useMemo(
    () =>
      getWeekRibbon(
        state.readingLog.completedDates,
        state.readingLog.graceShieldDates,
        todayStr
      ),
    [state.readingLog.completedDates, state.readingLog.graceShieldDates, todayStr]
  );

  const rankInfo = useMemo(() => getRankInfo(state.readingLog.xp), [state.readingLog.xp]);
  const topicInk = useMemo(() => getTopicInk(verse.topic), [verse.topic]);
  const redLetterEnabled = state.preferences.redLetterEnabled !== false;

  const yesterdayMissed =
    !state.readingLog.completedDates.includes(yesterdayStr) &&
    !state.readingLog.graceShieldDates.includes(yesterdayStr) &&
    state.readingLog.completedDates.some((d) => d < yesterdayStr);

  const [reflectionText, setReflectionText] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Interactive 3-word Verse Recall Practice state
  const verseText =
    state.preferences.translation === 'KJV' ? verse.kjv : verse.web;
  const recallSetup = useMemo(() => {
    const tokens = verseText.split(' ');
    const candidates = tokens
      .map((word, index) => ({
        word,
        clean: word.replace(/[^a-zA-Z’']/g, ''),
        index,
      }))
      .filter((item) => item.clean.length >= 5);

    const pickedIndices: number[] = [];
    if (candidates.length >= 3) {
      pickedIndices.push(
        candidates[0].index,
        candidates[Math.floor(candidates.length / 2)].index,
        candidates[candidates.length - 1].index
      );
    }
    return { tokens, pickedIndices };
  }, [verseText]);

  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const alreadyMemorizedToday = state.readingLog.memorizedVerseIds.includes(verse.id);

  useEffect(() => {
    setRevealedIndices([]);
  }, [verse.id, state.preferences.translation]);

  useEffect(() => {
    if (!timerRunning) return;
    if (secondsLeft <= 0) {
      setTimerRunning(false);
      return;
    }
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, secondsLeft]);

  const handleRevealBlank = (idx: number) => {
    if (revealedIndices.includes(idx)) return;
    const next = [...revealedIndices, idx];
    setRevealedIndices(next);
    if (
      recallSetup.pickedIndices.length > 0 &&
      next.length === recallSetup.pickedIndices.length
    ) {
      onCompleteVerseMemory(verse.id, verse.reference);
    }
  };

  const handleSpeakVerse = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onCopySuccess('Audio unavailable', 'Speech synthesis is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${verse.reference}. ${verseText}`);
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyVerse = async () => {
    const shareText = `"${verseText}" — ${verse.reference} (${state.preferences.translation})\n${streakStats.currentStreak > 0 ? `Day ${streakStats.currentStreak} reading streak on Selah` : 'Daily reading on Selah'}`;
    try {
      await navigator.clipboard.writeText(shareText);
      onCopySuccess('Verse copied', `${verse.reference} copied to clipboard for sharing.`);
    } catch {
      onCopySuccess('Copy unavailable', 'Select and copy the verse text directly.');
    }
  };

  const verseBookmarkKey = `${verse.chapterId}:${verse.verseNumber}`;
  const isDailyBookmarked = Boolean(state.highlights[verseBookmarkKey]?.bookmarked);

  const handleSubmitReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionText.trim()) return;
    onSaveReflection({
      reference: `${chapter.book} ${chapter.chapter}`,
      chapterId: chapter.id,
      note: reflectionText,
    });
    setReflectionText('');
  };

  const todayJournalCount = state.journalEntries.filter((j) => j.date === todayStr).length;

  return (
    <div className="space-y-10">
      {/* 7-Day Habit Ribbon + Grace Shield Recovery */}
      <section aria-label="Weekly reading streak" className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
                <Flame className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                <span className="font-mono tabular-nums">{streakStats.currentStreak}</span> day streak
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Rank: <strong className="font-semibold text-indigo-900 dark:text-indigo-300">{rankInfo.name}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-medium tabular-nums text-emerald-800 dark:text-emerald-300">{state.readingLog.xp} XP</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-blue-900 dark:text-blue-300">
                <Shield className="h-3.5 w-3.5 text-blue-900 dark:text-blue-400" />
                <span className="font-mono tabular-nums">{state.readingLog.graceShields}</span> Grace Shield
                {state.readingLog.graceShields === 1 ? '' : 's'}
              </span>
            </div>
            {yesterdayMissed && state.readingLog.graceShields > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onApplyGraceShield}
                  className="text-sm font-medium text-blue-900 underline underline-offset-4 hover:text-blue-950 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Missed yesterday? Apply 1 Grace Shield to preserve your streak
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {weekRibbon.map((day) => {
              const statusLabel =
                day.status === 'completed'
                  ? 'Completed'
                  : day.status === 'grace'
                  ? 'Grace Shield'
                  : day.status === 'today-pending'
                  ? 'Today'
                  : 'Open';
              return (
                <div
                  key={day.date}
                  title={`${day.dayShort} ${day.dayNum}: ${statusLabel}`}
                  className={`flex min-w-[44px] flex-col items-center justify-center rounded-xl border px-2 py-2 text-center transition-colors ${
                    day.status === 'completed'
                      ? 'border-blue-900 bg-blue-900 text-white dark:border-blue-600 dark:bg-blue-700'
                      : day.status === 'grace'
                      ? 'border-amber-700/40 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      : day.isToday
                      ? 'border-zinc-900 bg-white text-zinc-900 dark:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-100'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400'
                  }`}
                >
                  <span className="text-[11px] font-medium">{day.dayShort}</span>
                  <span className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                    {day.dayNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Hero Split: Personalized Daily Verse + Editorial Sanctuary Frame */}
      <section className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 lg:col-span-7 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <span className="text-zinc-700 dark:text-zinc-300">Personalized Daily Verse</span>
                <span aria-hidden="true"> · </span>
                <span className={`font-semibold ${topicInk.text}`}>
                  {FOCUS_TOPICS.find((t) => t.id === verse.topic)?.label}
                </span>
                {verse.isRedLetter && redLetterEnabled && (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span className="font-medium text-rose-800 dark:text-rose-300">
                      Words of Christ
                    </span>
                  </>
                )}
              </div>

              <div
                role="group"
                aria-label="Bible translation"
                className="inline-flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
              >
                {(['WEB', 'KJV'] as Translation[]).map((tr) => (
                  <button
                    key={tr}
                    type="button"
                    onClick={() => onSetTranslation(tr)}
                    className={`min-h-[36px] whitespace-nowrap rounded-md px-3 text-xs font-semibold transition-colors ${
                      state.preferences.translation === tr
                        ? 'bg-white text-blue-950 shadow-xs dark:bg-zinc-950 dark:text-amber-300'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                  >
                    {tr}
                  </button>
                ))}
              </div>
            </div>

            <h1 className={`mt-5 font-serif text-3xl font-medium tracking-tight sm:text-4xl ${topicInk.heading}`} style={{ textWrap: 'balance' }}>
              {verse.reference}
            </h1>

            <blockquote
              className={`mt-5 border-y border-zinc-200 py-6 font-serif text-xl leading-relaxed sm:text-2xl dark:border-zinc-800 ${
                verse.isRedLetter && redLetterEnabled
                  ? 'text-rose-800 dark:text-rose-300'
                  : 'text-zinc-800 dark:text-zinc-100'
              }`}
            >
              <span className="text-amber-800 dark:text-amber-300">“</span>
              {verseText}
              <span className="text-amber-800 dark:text-amber-300">”</span>
            </blockquote>

            <p className="mt-5 max-w-prose text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
              {verse.encouragement}
            </p>

            {/* Focus Topic Personalization Bar */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Tune your daily focus topics
              </p>
              <div className="flex flex-wrap gap-2">
                {FOCUS_TOPICS.map((topic) => {
                  const selected = state.preferences.focusTopics.includes(topic.id);
                  const ink = getTopicInk(topic.id);
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => onToggleTopic(topic.id)}
                      className={`min-h-[38px] whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected ? ink.activeButton : ink.inactiveButton
                      }`}
                    >
                      {topic.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <button
              type="button"
              onClick={() =>
                streakStats.completedToday
                  ? onOpenChapterInReader(chapter.id)
                  : onCompleteReading(chapter.id, chapter.readMinutes)
              }
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900 ${
                streakStats.completedToday
                  ? 'border border-emerald-800/30 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-700/40 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-blue-900 text-white hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-600'
              }`}
            >
              <Check className="h-4 w-4" />
              {streakStats.completedToday
                ? 'Today Logged — Read Full Chapter'
                : 'Complete Today’s Reading (+50 XP)'}
            </button>

            <button
              type="button"
              onClick={() =>
                onToggleHighlightOrBookmark({
                  chapterId: verse.chapterId,
                  reference: verse.reference,
                  verseNumber: verse.verseNumber,
                  text: verseText,
                  mode: 'bookmark',
                })
              }
              className={`inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                isDailyBookmarked
                  ? 'border-blue-900/40 bg-blue-50 text-blue-900 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <Bookmark className="h-4 w-4" />
              {isDailyBookmarked ? 'Saved' : 'Save'}
            </button>

            <button
              type="button"
              onClick={handleSpeakVerse}
              aria-label="Listen to verse aloud"
              className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Volume2 className="h-4 w-4" />
              Listen
            </button>

            <button
              type="button"
              onClick={handleCopyVerse}
              aria-label="Copy verse and streak summary"
              className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Copy className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>

        {/* Right Editorial Sanctuary Visual + Next Rank Progress */}
        <div className="relative flex min-h-[320px] flex-col justify-end overflow-hidden rounded-2xl border border-zinc-200 lg:col-span-5 dark:border-zinc-800">
          <ResilientImage
            src={HERO_IMAGE}
            alt="Open linen-bound Bible in soft morning sunlight on an oak desk"
            fallbackTitle="Morning Sanctuary"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          <div className="relative z-10 p-6 text-white sm:p-8">
            <div className="flex items-center justify-between gap-4 text-xs text-zinc-200">
              <span>Progression Path</span>
              <span className="font-mono tabular-nums">
                {rankInfo.nextXp
                  ? `${state.readingLog.xp} / ${rankInfo.nextXp} XP`
                  : `${state.readingLog.xp} XP · Mastered`}
              </span>
            </div>
            <h2 className="mt-1.5 font-serif text-2xl font-medium text-white">
              {rankInfo.name}
            </h2>
            <p className="mt-1 text-sm text-zinc-200">
              {rankInfo.nextRankName
                ? `${rankInfo.nextXp! - state.readingLog.xp} XP until ${rankInfo.nextRankName} rank`
                : 'Highest seasonal rank reached — keep walking in the Word'}
            </p>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white transition-all duration-300"
                style={{ width: `${rankInfo.progressPercent}%` }}
              />
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4 text-xs text-zinc-200">
              <span>Longest streak: <strong className="font-mono tabular-nums text-white">{streakStats.longestStreak}d</strong></span>
              <span>Chapters read: <strong className="font-mono tabular-nums text-white">{state.readingLog.completedChapterIds.length}</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Grid: Selah Pause + Verse Recall Practice */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Quiet 60s Selah Pause */}
        <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <div className="text-xs font-medium text-teal-800 dark:text-teal-300">
              Contemplative Cadence · 1 min pause
            </div>
            <h2 className="mt-2 font-serif text-xl font-medium text-blue-950 dark:text-blue-200">
              Quiet Selah Minute
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Take sixty unhurried seconds to breathe slowly and reread{' '}
              <span className="font-medium text-indigo-900 dark:text-indigo-300">{verse.reference}</span>{' '}
              before checking messages.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <span className="font-mono text-3xl font-semibold tabular-nums text-amber-800 dark:text-amber-300">
              {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:
              {String(secondsLeft % 60).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTimerRunning((prev) => !prev)}
                className="inline-flex min-h-[42px] items-center gap-2 whitespace-nowrap rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {timerRunning ? 'Pause' : secondsLeft === 0 ? 'Done' : 'Begin Pause'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setSecondsLeft(60);
                }}
                aria-label="Reset timer"
                className="flex min-h-[42px] min-w-[42px] items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Verse Recall Practice */}
        <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-7 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                Hide It in Your Heart · +20 XP
              </span>
              <span className="font-mono text-xs tabular-nums text-indigo-900 dark:text-indigo-300">
                {alreadyMemorizedToday
                  ? 'Practiced'
                  : `${revealedIndices.length}/${recallSetup.pickedIndices.length} revealed`}
              </span>
            </div>
            <h2 className="mt-2 font-serif text-xl font-medium text-indigo-950 dark:text-indigo-200">
              Verse Recall Practice
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Speak the missing words aloud from memory, then tap each blank to reveal and earn XP.
            </p>

            <div className="mt-4 rounded-xl bg-zinc-50 p-4 font-serif text-lg leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              {recallSetup.tokens.map((token, idx) => {
                const isBlank = recallSetup.pickedIndices.includes(idx);
                const isRevealed = revealedIndices.includes(idx) || alreadyMemorizedToday;
                if (!isBlank) {
                  return <span key={idx}>{token} </span>;
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleRevealBlank(idx)}
                    className={`mx-1 inline-flex min-h-[32px] items-center rounded-md border px-2 py-0.5 font-sans text-sm font-medium transition-colors ${
                      isRevealed
                        ? 'border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:border-emerald-600/40 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'border-blue-900/40 bg-white text-blue-900 hover:bg-blue-50 dark:border-blue-500/40 dark:bg-zinc-900 dark:text-blue-300'
                    }`}
                  >
                    {isRevealed ? token : 'Reveal word'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>{verse.reference}</span>
            {revealedIndices.length > 0 && !alreadyMemorizedToday && (
              <button
                type="button"
                onClick={() => setRevealedIndices([])}
                className="font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-300"
              >
                Reset blanks
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Guided Chapter Reading + Personal Reflection */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end dark:border-zinc-800">
          <div>
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span className="text-indigo-900 dark:text-indigo-300">Today’s Guided Passage</span>
              <span aria-hidden="true"> · </span>
              <span className="font-semibold text-amber-800 dark:text-amber-300">{chapter.book} {chapter.chapter}</span>
              <span aria-hidden="true"> · </span>
              <span>{chapter.readMinutes} min read</span>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-medium text-blue-950 sm:text-3xl dark:text-blue-100">
              {chapter.title}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
              {chapter.summary}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChapterInReader(chapter.id)}
            className="min-h-[42px] shrink-0 whitespace-nowrap rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-blue-900 transition-colors hover:bg-blue-50 dark:border-zinc-700 dark:text-blue-300 dark:hover:bg-zinc-800"
          >
            Open in Full Reader
          </button>
        </div>

        <div className="grid grid-cols-1 gap-10 pt-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Tap any verse to highlight it in your study treasury.
            </p>
            <div className="max-w-prose space-y-4">
              {chapter.verses.map((v, vIdx) => {
                const key = `${chapter.id}:${v.number}`;
                const saved = state.highlights[key];
                const text =
                  state.preferences.translation === 'KJV' ? v.kjv : v.web;
                const showRed = Boolean(v.isRedLetter && redLetterEnabled);
                return (
                  <div
                    key={v.number}
                    className={`group rounded-xl p-3 transition-colors ${
                      saved?.highlighted
                        ? 'bg-amber-50/90 dark:bg-amber-950/30'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-950/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className={`font-serif text-lg leading-relaxed ${
                          showRed
                            ? 'text-rose-800 dark:text-rose-300'
                            : 'text-zinc-800 dark:text-zinc-200'
                        } ${vIdx === 0 && !showRed ? 'first-letter:font-semibold first-letter:text-amber-800 dark:first-letter:text-amber-300' : ''}`}
                      >
                        <sup className="mr-2 font-mono text-xs font-semibold tabular-nums text-amber-800 dark:text-amber-400">
                          {v.number}
                        </sup>
                        {text}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onToggleHighlightOrBookmark({
                            chapterId: chapter.id,
                            reference: `${chapter.book} ${chapter.chapter}:${v.number}`,
                            verseNumber: v.number,
                            text,
                            mode: 'highlight',
                          })
                        }
                        aria-label={`Highlight ${chapter.book} ${chapter.chapter}:${v.number}`}
                        className={`flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg transition-colors ${
                          saved?.highlighted
                            ? 'text-amber-800 dark:text-amber-300'
                            : 'text-zinc-400 opacity-70 hover:text-amber-800 group-hover:opacity-100 dark:hover:text-amber-300'
                        }`}
                      >
                        <Highlighter className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={handleSubmitReflection}
            className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-5 lg:col-span-5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div>
              <div className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                Daily Reflection · +25 XP
              </div>
              <h3 className="mt-2 font-serif text-lg font-medium text-indigo-950 dark:text-indigo-200">
                {chapter.reflectionPrompt}
              </h3>

              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="Write a brief prayer, takeaway, or verse that stood out to you..."
                className="mt-4 w-full rounded-xl border border-zinc-200 bg-white p-3.5 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-blue-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                {todayJournalCount > 0
                  ? `${todayJournalCount} note${todayJournalCount === 1 ? '' : 's'} saved today`
                  : `${reflectionText.length}/1000`}
              </span>
              <button
                type="submit"
                disabled={!reflectionText.trim()}
                className="min-h-[42px] whitespace-nowrap rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                Save Reflection
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
