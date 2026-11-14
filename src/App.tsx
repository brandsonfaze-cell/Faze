import { useMemo, useState } from 'react';
import { EncouragementToast } from './components/EncouragementToast';
import { ProgressView } from './components/ProgressView';
import { RemindersView } from './components/RemindersView';
import { ScriptureView } from './components/ScriptureView';
import { TodayView } from './components/TodayView';
import { TopNav } from './components/TopNav';
import { getPersonalizedDailySelection } from './data/scripture';
import { useBibleProgress } from './hooks/useBibleProgress';
import { AppTab } from './types/bible';
import { calculateStreakStats, formatLocalDate } from './utils/gamification';

export default function App() {
  const {
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
  } = useBibleProgress();

  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const todayStr = formatLocalDate();

  const dailySelection = useMemo(
    () => getPersonalizedDailySelection(state.preferences.focusTopics, todayStr),
    [state.preferences.focusTopics, todayStr]
  );

  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    dailySelection.chapter.id
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

  const unreadNotifications = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications]
  );

  const handleOpenChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setActiveTab('scripture');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeaderPrimaryAction = () => {
    if (streakStats.completedToday) {
      setActiveTab('scripture');
    } else {
      completeDailyReading(dailySelection.chapter.id, dailySelection.chapter.readMinutes);
    }
  };

  const handleNotice = (title: string, message: string) => {
    showToast({ title, message });
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <TopNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        completedToday={streakStats.completedToday}
        onPrimaryAction={handleHeaderPrimaryAction}
        unreadNotifications={unreadNotifications}
      />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 md:pb-14 lg:px-8">
        {activeTab === 'today' && (
          <TodayView
            state={state}
            onCompleteReading={completeDailyReading}
            onSaveReflection={saveJournalReflection}
            onToggleHighlightOrBookmark={toggleHighlightOrBookmark}
            onCompleteVerseMemory={completeVerseMemory}
            onApplyGraceShield={applyGraceShieldToYesterday}
            onToggleTopic={toggleFocusTopic}
            onSetTranslation={setTranslation}
            onOpenChapterInReader={handleOpenChapter}
            onCopySuccess={handleNotice}
          />
        )}

        {activeTab === 'scripture' && (
          <ScriptureView
            state={state}
            selectedChapterId={selectedChapterId}
            onSelectChapter={setSelectedChapterId}
            onCompleteChapter={(chapterId, mins) => completeDailyReading(chapterId, mins)}
            onToggleHighlightOrBookmark={toggleHighlightOrBookmark}
            onSetTranslation={setTranslation}
            onSetFontSize={(fontSize) => updatePreferences({ fontSize })}
            onToggleRedLetter={() =>
              updatePreferences({
                redLetterEnabled: !(state.preferences.redLetterEnabled !== false),
              })
            }
          />
        )}

        {activeTab === 'progress' && (
          <ProgressView
            state={state}
            onOpenChapterInReader={handleOpenChapter}
            onShareProgress={handleNotice}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersView
            state={state}
            onEnableBrowserNotifications={enableBrowserNotifications}
            onSendEncouragementNow={sendEncouragementNow}
            onUpdateReminderSettings={updateReminderSettings}
            onMarkRead={markNotificationRead}
            onMarkAllRead={markAllNotificationsRead}
            onUpdatePreferences={updatePreferences}
            onToggleTopic={toggleFocusTopic}
            onExportJson={exportProgressJson}
            onImportJson={importProgressJson}
          />
        )}
      </main>

      <footer className="hidden border-t border-zinc-200 py-8 md:block dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-xs text-zinc-500 sm:px-6 lg:px-8 dark:text-zinc-400">
          <span>Selah — Daily Scripture & Habit Companion</span>
          <span>World English Bible (WEB) · King James Version (KJV)</span>
        </div>
      </footer>

      <EncouragementToast toast={activeToast} onDismiss={dismissToast} />
    </div>
  );
}
