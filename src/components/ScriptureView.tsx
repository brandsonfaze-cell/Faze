import {
  Bookmark,
  Check,
  ChevronRight,
  Highlighter,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { FOCUS_TOPICS, SCRIPTURE_CHAPTERS } from '../data/scripture';
import { BibleAppState, FocusTopic, Translation } from '../types/bible';
import { getTopicInk } from '../utils/themeColors';
import { ResilientImage } from './ResilientImage';

interface ScriptureViewProps {
  state: BibleAppState;
  selectedChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onCompleteChapter: (chapterId: string, minutesSpent: number) => void;
  onToggleHighlightOrBookmark: (params: {
    chapterId: string;
    reference: string;
    verseNumber: number;
    text: string;
    mode: 'highlight' | 'bookmark';
  }) => void;
  onSetTranslation: (translation: Translation) => void;
  onSetFontSize: (size: 'sm' | 'md' | 'lg') => void;
  onToggleRedLetter: () => void;
}

const OT_IMAGE = '/src/assets/images/psalms_olive_branch_1794684003110.jpg';
const NT_IMAGE = '/src/assets/images/scripture_stone_archway_1794684004259.jpg';

export function ScriptureView({
  state,
  selectedChapterId,
  onSelectChapter,
  onCompleteChapter,
  onToggleHighlightOrBookmark,
  onSetTranslation,
  onSetFontSize,
  onToggleRedLetter,
}: ScriptureViewProps) {
  const redLetterEnabled = state.preferences.redLetterEnabled !== false;
  const [testamentFilter, setTestamentFilter] = useState<'all' | 'Old Testament' | 'New Testament'>('all');
  const [topicFilter, setTopicFilter] = useState<'all' | FocusTopic>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChapters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SCRIPTURE_CHAPTERS.filter((ch) => {
      if (testamentFilter !== 'all' && ch.testament !== testamentFilter) return false;
      if (topicFilter !== 'all' && !ch.topics.includes(topicFilter)) return false;
      if (!q) return true;
      const inMeta =
        ch.book.toLowerCase().includes(q) ||
        ch.title.toLowerCase().includes(q) ||
        ch.summary.toLowerCase().includes(q) ||
        `${ch.book} ${ch.chapter}`.toLowerCase().includes(q);
      if (inMeta) return true;
      return ch.verses.some(
        (v) => v.web.toLowerCase().includes(q) || v.kjv.toLowerCase().includes(q)
      );
    });
  }, [testamentFilter, topicFilter, searchQuery]);

  const activeChapter = useMemo(() => {
    return (
      SCRIPTURE_CHAPTERS.find((c) => c.id === selectedChapterId) ??
      filteredChapters[0] ??
      SCRIPTURE_CHAPTERS[0]
    );
  }, [selectedChapterId, filteredChapters]);

  const currentIdx = SCRIPTURE_CHAPTERS.findIndex((c) => c.id === activeChapter.id);
  const nextChapter =
    currentIdx >= 0 && currentIdx < SCRIPTURE_CHAPTERS.length - 1
      ? SCRIPTURE_CHAPTERS[currentIdx + 1]
      : SCRIPTURE_CHAPTERS[0];

  const isChapterRead = state.readingLog.completedChapterIds.includes(activeChapter.id);

  const fontSizeClass =
    state.preferences.fontSize === 'sm'
      ? 'text-base leading-relaxed'
      : state.preferences.fontSize === 'lg'
      ? 'text-xl leading-loose'
      : 'text-lg leading-relaxed';

  return (
    <div className="space-y-8">
      {/* Search & Filters Header */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-medium text-blue-950 sm:text-3xl dark:text-blue-200">
              Scripture Library
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Explore curated Old and New Testament passages. Spoken words of Jesus appear in traditional{' '}
              <span className="font-medium text-rose-800 dark:text-rose-300">red-letter</span> ink.
            </p>
          </div>

          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, verses, themes..."
              aria-label="Search Scripture"
              className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'Old Testament', 'New Testament'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTestamentFilter(t)}
                className={`min-h-[38px] whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  testamentFilter === t
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {t === 'all' ? 'All Testaments' : t}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTopicFilter('all')}
              className={`min-h-[38px] whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                topicFilter === 'all'
                  ? 'border-blue-900 bg-blue-900 text-white dark:border-blue-600 dark:bg-blue-700'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
              }`}
            >
              All Topics
            </button>
            {FOCUS_TOPICS.map((topic) => {
              const ink = getTopicInk(topic.id);
              const active = topicFilter === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setTopicFilter(topic.id)}
                  className={`min-h-[38px] whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active ? ink.activeButton : ink.inactiveButton
                  }`}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Two-column Index + Reader */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Chapter List */}
        <aside className="space-y-2 lg:col-span-4">
          <div className="flex items-center justify-between px-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Passages ({filteredChapters.length})</span>
            <span className="font-mono tabular-nums">
              {state.readingLog.completedChapterIds.length}/{SCRIPTURE_CHAPTERS.length} read
            </span>
          </div>

          {filteredChapters.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No chapters match your current filters. Try clearing your search query.
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {filteredChapters.map((ch) => {
                const active = ch.id === activeChapter.id;
                const read = state.readingLog.completedChapterIds.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => onSelectChapter(ch.id)}
                    className={`flex min-h-[60px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                      active
                        ? 'bg-zinc-100 dark:bg-zinc-800/80'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-950/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span
                          className={`font-semibold ${
                            ch.testament === 'Old Testament'
                              ? 'text-amber-800 dark:text-amber-300'
                              : 'text-blue-900 dark:text-blue-300'
                          }`}
                        >
                          {ch.book} {ch.chapter}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{ch.readMinutes} min</span>
                        {read && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-emerald-800 dark:text-emerald-400">Read</span>
                          </>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {ch.title}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Active Editorial Reader */}
        <article className="rounded-2xl border border-zinc-200 bg-white lg:col-span-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative h-48 overflow-hidden rounded-t-2xl border-b border-zinc-200 sm:h-56 dark:border-zinc-800">
            <ResilientImage
              src={activeChapter.testament === 'Old Testament' ? OT_IMAGE : NT_IMAGE}
              alt={
                activeChapter.testament === 'Old Testament'
                  ? 'Olive branch resting on archival cotton paper'
                  : 'Stone cloister archway bathed in soft morning light'
              }
              fallbackTitle={`${activeChapter.book} ${activeChapter.chapter}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="text-xs text-zinc-200">
                <span>{activeChapter.testament}</span>
                <span aria-hidden="true"> · </span>
                <span>{activeChapter.book} {activeChapter.chapter}</span>
                <span aria-hidden="true"> · </span>
                <span>{activeChapter.readMinutes} min read</span>
              </div>
              <h2 className="mt-1 font-serif text-2xl font-medium sm:text-3xl">
                {activeChapter.title}
              </h2>
            </div>
          </div>

          {/* Reader Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-3">
              <div
                role="group"
                aria-label="Translation"
                className="inline-flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
              >
                {(['WEB', 'KJV'] as Translation[]).map((tr) => (
                  <button
                    key={tr}
                    type="button"
                    onClick={() => onSetTranslation(tr)}
                    className={`min-h-[34px] rounded-md px-3 text-xs font-semibold transition-colors ${
                      state.preferences.translation === tr
                        ? 'bg-white text-blue-950 shadow-xs dark:bg-zinc-950 dark:text-amber-300'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {tr}
                  </button>
                ))}
              </div>

              <div
                role="group"
                aria-label="Text size"
                className="inline-flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
              >
                {(['sm', 'md', 'lg'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => onSetFontSize(sz)}
                    className={`min-h-[34px] rounded-md px-2.5 text-xs font-semibold uppercase transition-colors ${
                      state.preferences.fontSize === sz
                        ? 'bg-white text-blue-950 shadow-xs dark:bg-zinc-950 dark:text-amber-300'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onToggleRedLetter}
                aria-pressed={redLetterEnabled}
                className={`min-h-[36px] whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition-colors ${
                  redLetterEnabled
                    ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                    : 'border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'
                }`}
              >
                Red-Letter {redLetterEnabled ? 'On' : 'Off'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => onCompleteChapter(activeChapter.id, activeChapter.readMinutes)}
              className={`inline-flex min-h-[42px] items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isChapterRead
                  ? 'border border-emerald-800/30 bg-emerald-50 text-emerald-900 dark:border-emerald-700/40 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-blue-900 text-white hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-600'
              }`}
            >
              <Check className="h-4 w-4" />
              {isChapterRead ? 'Chapter Completed' : 'Complete Chapter (+40 XP)'}
            </button>
          </div>

          {/* Verses */}
          <div className="p-6 sm:p-8">
            <p className="mb-6 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
              {activeChapter.summary}
            </p>

            <div className="max-w-prose space-y-5">
              {activeChapter.verses.map((v, vIdx) => {
                const key = `${activeChapter.id}:${v.number}`;
                const saved = state.highlights[key];
                const text =
                  state.preferences.translation === 'KJV' ? v.kjv : v.web;
                const refLabel = `${activeChapter.book} ${activeChapter.chapter}:${v.number}`;
                const showRed = Boolean(v.isRedLetter && redLetterEnabled);
                return (
                  <div
                    key={v.number}
                    className={`group rounded-xl p-3.5 transition-colors ${
                      saved?.highlighted
                        ? 'bg-amber-50/90 dark:bg-amber-950/30'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-950/60'
                    }`}
                  >
                    <p
                      className={`font-serif ${fontSizeClass} ${
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
                    <div className="mt-2 flex items-center gap-2 opacity-85 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() =>
                          onToggleHighlightOrBookmark({
                            chapterId: activeChapter.id,
                            reference: refLabel,
                            verseNumber: v.number,
                            text,
                            mode: 'highlight',
                          })
                        }
                        className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${
                          saved?.highlighted
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
                            : 'text-zinc-500 hover:bg-zinc-200/70 hover:text-amber-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-amber-200'
                        }`}
                      >
                        <Highlighter className="h-3.5 w-3.5" />
                        {saved?.highlighted ? 'Highlighted' : 'Highlight'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onToggleHighlightOrBookmark({
                            chapterId: activeChapter.id,
                            reference: refLabel,
                            verseNumber: v.number,
                            text,
                            mode: 'bookmark',
                          })
                        }
                        className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${
                          saved?.bookmarked
                            ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-300'
                            : 'text-zinc-500 hover:bg-zinc-200/70 hover:text-blue-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-blue-300'
                        }`}
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        {saved?.bookmarked ? 'Bookmarked' : 'Bookmark'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold text-indigo-900 dark:text-indigo-300">Reflection:</span>{' '}
                {activeChapter.reflectionPrompt}
              </p>
              <button
                type="button"
                onClick={() => onSelectChapter(nextChapter.id)}
                className="inline-flex min-h-[42px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-blue-900 transition-colors hover:bg-blue-50 dark:border-zinc-700 dark:text-blue-300 dark:hover:bg-zinc-800"
              >
                Next: {nextChapter.book} {nextChapter.chapter}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
