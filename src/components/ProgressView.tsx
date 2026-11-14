import {
  Award,
  Bookmark,
  CheckCircle2,
  Copy,
  Flame,
  NotebookPen,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { SCRIPTURE_CHAPTERS } from '../data/scripture';
import { BibleAppState } from '../types/bible';
import {
  calculateStreakStats,
  computeAchievements,
  formatLocalDate,
  getHeatmapDays,
  getRankInfo,
} from '../utils/gamification';

interface ProgressViewProps {
  state: BibleAppState;
  onOpenChapterInReader: (chapterId: string) => void;
  onShareProgress: (title: string, message: string) => void;
}

export function ProgressView({
  state,
  onOpenChapterInReader,
  onShareProgress,
}: ProgressViewProps) {
  const todayStr = formatLocalDate();
  const streakStats = useMemo(
    () =>
      calculateStreakStats(
        state.readingLog.completedDates,
        state.readingLog.graceShieldDates,
        todayStr
      ),
    [state.readingLog.completedDates, state.readingLog.graceShieldDates, todayStr]
  );

  const rankInfo = useMemo(() => getRankInfo(state.readingLog.xp), [state.readingLog.xp]);
  const achievements = useMemo(() => computeAchievements(state), [state]);
  const heatmapDays = useMemo(
    () =>
      getHeatmapDays(
        state.readingLog.completedDates,
        state.readingLog.graceShieldDates,
        todayStr,
        12
      ),
    [state.readingLog.completedDates, state.readingLog.graceShieldDates, todayStr]
  );

  const [selectedHeatmapLabel, setSelectedHeatmapLabel] = useState<string>(
    'Select any day square to inspect your reading record.'
  );

  const savedVerses = useMemo(
    () =>
      Object.values(state.highlights).sort((a, b) =>
        b.savedAt.localeCompare(a.savedAt)
      ),
    [state.highlights]
  );

  const otChapters = SCRIPTURE_CHAPTERS.filter((c) => c.testament === 'Old Testament');
  const ntChapters = SCRIPTURE_CHAPTERS.filter((c) => c.testament === 'New Testament');
  const otRead = otChapters.filter((c) =>
    state.readingLog.completedChapterIds.includes(c.id)
  ).length;
  const ntRead = ntChapters.filter((c) =>
    state.readingLog.completedChapterIds.includes(c.id)
  ).length;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const handleCopyReport = async () => {
    const summary = `Selah Reading Progress — ${rankInfo.name} (${state.readingLog.xp} XP)\nCurrent streak: ${streakStats.currentStreak} days (Best: ${streakStats.longestStreak} days)\nChapters completed: ${state.readingLog.completedChapterIds.length}/${SCRIPTURE_CHAPTERS.length}\nMilestones unlocked: ${unlockedCount}/${achievements.length}`;
    try {
      await navigator.clipboard.writeText(summary);
      onShareProgress('Progress summary copied', 'Share your milestone update with an accountability partner.');
    } catch {
      onShareProgress('Clipboard unavailable', 'Unable to copy automatically in this browser.');
    }
  };

  return (
    <div className="space-y-10">
      {/* Header + Share Action */}
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end dark:border-zinc-800">
        <div>
          <h1 className="font-serif text-3xl font-medium text-blue-950 dark:text-blue-200">
            Growth Over Time
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Track consistency across weeks, milestone ranks, and verses treasured along the way.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyReport}
          className="inline-flex min-h-[42px] items-center gap-2 self-start whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 transition-colors hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-blue-300 dark:hover:bg-zinc-800"
        >
          <Copy className="h-4 w-4" />
          Share Progress Summary
        </button>
      </div>

      {/* 4-Column KPI Strip */}
      <section aria-label="Reading metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Current Streak</span>
            <Flame className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          </div>
          <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-amber-800 dark:text-amber-300">
            {streakStats.currentStreak}d
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Longest: <span className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">{streakStats.longestStreak}</span> days
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Rank & Experience</span>
            <TrendingUp className="h-4 w-4 text-indigo-900 dark:text-indigo-400" />
          </div>
          <p className="mt-3 font-serif text-2xl font-semibold text-indigo-900 dark:text-indigo-300">
            {rankInfo.name}
          </p>
          <p className="mt-1 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            {state.readingLog.xp} XP {rankInfo.nextRankName ? `· Next: ${rankInfo.nextRankName}` : ''}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Chapters Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-800 dark:text-emerald-400" />
          </div>
          <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-emerald-800 dark:text-emerald-300">
            {state.readingLog.completedChapterIds.length}
            <span className="text-lg font-normal text-zinc-400">/{SCRIPTURE_CHAPTERS.length}</span>
          </p>
          <p className="mt-1 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            {state.readingLog.totalMinutesRead} min in Scripture
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Grace Shields</span>
            <Shield className="h-4 w-4 text-blue-900 dark:text-blue-400" />
          </div>
          <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-blue-900 dark:text-blue-300">
            {state.readingLog.graceShields}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Earned every 7-day streak
          </p>
        </div>
      </section>

      {/* 12-Week Consistency Heatmap + Canon Progress */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-7 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-100">
                12-Week Reading Rhythm
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {selectedHeatmapLabel}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-zinc-200 dark:bg-zinc-800" />
                Open
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-amber-600/70 dark:bg-amber-500/70" />
                Grace
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-blue-900 dark:bg-blue-500" />
                Read
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-12 gap-1.5 sm:gap-2">
            {heatmapDays.map((day) => (
              <button
                key={day.date}
                type="button"
                title={day.label}
                aria-label={day.label}
                onClick={() => setSelectedHeatmapLabel(day.label)}
                className={`aspect-square w-full rounded-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-blue-900 ${
                  day.level === 2
                    ? 'bg-blue-900 dark:bg-blue-500'
                    : day.level === 1
                    ? 'bg-amber-600/75 dark:bg-amber-500/75'
                    : 'bg-zinc-100 dark:bg-zinc-800'
                } ${day.isToday ? 'ring-2 ring-zinc-900 ring-offset-1 dark:ring-zinc-200 dark:ring-offset-zinc-900' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-100">
              Testament Progress
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Your reading coverage across curated library passages.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">Old Testament</span>
                  <span className="font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                    {otRead} / {otChapters.length} chapters
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-blue-900 transition-all duration-300 dark:bg-blue-500"
                    style={{
                      width: `${otChapters.length ? Math.round((otRead / otChapters.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">New Testament</span>
                  <span className="font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                    {ntRead} / {ntChapters.length} chapters
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-800 transition-all duration-300 dark:bg-emerald-500"
                    style={{
                      width: `${ntChapters.length ? Math.round((ntRead / ntChapters.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-zinc-200 pt-4 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            Verses practiced in Selah Recall:{' '}
            <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
              {state.readingLog.memorizedVerseIds.length}
            </strong>
          </div>
        </div>
      </section>

      {/* Milestones / Achievements */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-medium text-zinc-900 dark:text-zinc-100">
              Milestones
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {unlockedCount} of {achievements.length} milestones unlocked
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map((ach) => {
            const pct = Math.round((ach.progress / ach.target) * 100);
            return (
              <div
                key={ach.id}
                className={`flex flex-col justify-between rounded-2xl border p-5 transition-colors ${
                  ach.unlocked
                    ? 'border-blue-900/30 bg-white dark:border-blue-500/40 dark:bg-zinc-900'
                    : 'border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Award
                      className={`h-5 w-5 ${
                        ach.unlocked
                          ? 'text-blue-900 dark:text-blue-400'
                          : 'text-zinc-400 dark:text-zinc-600'
                      }`}
                    />
                    <span className="font-mono text-xs tabular-nums text-amber-800 dark:text-amber-300">
                      +{ach.xpBonus} XP
                    </span>
                  </div>
                  <h3
                    className={`mt-3 font-serif text-lg font-medium ${
                      ach.unlocked
                        ? 'text-blue-950 dark:text-blue-200'
                        : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {ach.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {ach.description}
                  </p>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{ach.unlocked ? 'Unlocked' : ach.criteriaLabel}</span>
                    <span className="font-mono tabular-nums">
                      {ach.progress}/{ach.target}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        ach.unlocked
                          ? 'bg-blue-900 dark:bg-blue-500'
                          : 'bg-zinc-400 dark:bg-zinc-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Saved Verse Treasury & Reflections Journal */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-blue-900 dark:text-blue-400" />
              <h2 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-100">
                Saved Verse Treasury
              </h2>
            </div>
            <span className="font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
              {savedVerses.length}
            </span>
          </div>

          {savedVerses.length === 0 ? (
            <p className="py-8 text-sm text-zinc-500 dark:text-zinc-400">
              No saved or highlighted verses yet. Tap Bookmark or Highlight while reading any passage.
            </p>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {savedVerses.map((item) => (
                <div key={item.key} className="py-4">
                  <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold text-rose-900 dark:text-rose-300">
                      {item.reference}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenChapterInReader(item.chapterId)}
                      className="text-blue-900 underline underline-offset-4 hover:text-blue-950 dark:text-blue-400"
                    >
                      Open chapter
                    </button>
                  </div>
                  <p className="mt-1.5 font-serif text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                    “{item.text}”
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <NotebookPen className="h-4 w-4 text-emerald-800 dark:text-emerald-400" />
              <h2 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-100">
                Personal Reflections
              </h2>
            </div>
            <span className="font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
              {state.journalEntries.length}
            </span>
          </div>

          {state.journalEntries.length === 0 ? (
            <p className="py-8 text-sm text-zinc-500 dark:text-zinc-400">
              Your reflection notes will appear here as you journal on Today’s Guided Passage.
            </p>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {state.journalEntries.map((entry) => (
                <div key={entry.id} className="py-4">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                      {entry.reference}
                    </span>
                    <span className="font-mono tabular-nums text-amber-800 dark:text-amber-300">{entry.date}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {entry.note}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
