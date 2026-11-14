import {
  Bell,
  CheckCheck,
  Download,
  Moon,
  Send,
  Sun,
  Upload,
} from 'lucide-react';
import { useRef } from 'react';
import { FOCUS_TOPICS } from '../data/scripture';
import {
  BibleAppState,
  DailyGoal,
  FocusTopic,
  ReminderSettings,
  Translation,
} from '../types/bible';
import { getTopicInk } from '../utils/themeColors';

interface RemindersViewProps {
  state: BibleAppState;
  onEnableBrowserNotifications: () => void;
  onSendEncouragementNow: () => void;
  onUpdateReminderSettings: (patch: Partial<ReminderSettings>) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onUpdatePreferences: (patch: Partial<BibleAppState['preferences']>) => void;
  onToggleTopic: (topic: FocusTopic) => void;
  onExportJson: () => void;
  onImportJson: (text: string) => void;
}

export function RemindersView({
  state,
  onEnableBrowserNotifications,
  onSendEncouragementNow,
  onUpdateReminderSettings,
  onMarkRead,
  onMarkAllRead,
  onUpdatePreferences,
  onToggleTopic,
  onExportJson,
  onImportJson,
}: RemindersViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportJson(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const permissionLabel =
    state.reminders.browserPermission === 'granted'
      ? 'Browser alerts active'
      : state.reminders.browserPermission === 'denied'
      ? 'Blocked in browser settings'
      : state.reminders.browserPermission === 'unsupported'
      ? 'In-app reminders active'
      : 'Not yet enabled';

  return (
    <div className="space-y-10">
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end dark:border-zinc-800">
        <div>
          <h1 className="font-serif text-3xl font-medium text-blue-950 dark:text-blue-200">
            Encouraging Reminders & Preferences
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Schedule uplifting Scripture nudges tuned to your streak, focus topics, and reading pace.
          </p>
        </div>

        <button
          type="button"
          onClick={onSendEncouragementNow}
          className="inline-flex min-h-[44px] items-center gap-2 self-start whitespace-nowrap rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          <Send className="h-4 w-4" />
          Send Encouragement Now
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Encouraging Notification Feed */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-7 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-900 dark:text-blue-400" />
              <h2 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-100">
                Encouragement Feed
              </h2>
            </div>
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex min-h-[36px] items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {state.notifications.map((notif) => {
              const typeColor =
                notif.type === 'milestone'
                  ? 'text-amber-800 dark:text-amber-300'
                  : notif.type === 'encouragement'
                  ? 'text-emerald-800 dark:text-emerald-300'
                  : notif.type === 'grace'
                  ? 'text-rose-800 dark:text-rose-300'
                  : 'text-blue-900 dark:text-blue-300';
              return (
                <div
                  key={notif.id}
                  className={`py-4 transition-colors ${
                    notif.read ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className={`font-semibold capitalize ${typeColor}`}>
                          {notif.type}
                        </span>
                        {notif.verseReference && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-indigo-900 dark:text-indigo-300">
                              {notif.verseReference}
                            </span>
                          </>
                        )}
                        {!notif.read && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-rose-800 dark:text-rose-300">
                              New
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {notif.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                        {notif.message}
                      </p>
                    </div>
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={() => onMarkRead(notif.id)}
                        className="min-h-[36px] shrink-0 whitespace-nowrap rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Settings & Personalization Column */}
        <aside className="space-y-6 lg:col-span-5">
          {/* Daily Reminder Schedule */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-100">
              Daily Reminder Schedule
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Status: <span className="font-medium text-zinc-800 dark:text-zinc-200">{permissionLabel}</span>
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="reminder-enabled" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Daily gentle reminder
                </label>
                <button
                  id="reminder-enabled"
                  type="button"
                  role="switch"
                  aria-checked={state.reminders.enabled}
                  onClick={() =>
                    onUpdateReminderSettings({ enabled: !state.reminders.enabled })
                  }
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                    state.reminders.enabled
                      ? 'bg-blue-900 dark:bg-blue-600'
                      : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      state.reminders.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label htmlFor="reminder-time" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Reminder hour
                </label>
                <input
                  id="reminder-time"
                  type="time"
                  value={state.reminders.time}
                  onChange={(e) =>
                    onUpdateReminderSettings({ time: e.target.value })
                  }
                  className="min-h-[40px] rounded-lg border border-zinc-200 bg-zinc-50 px-3 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Encouragement tone
                </p>
                <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
                  {(['gentle', 'energizing', 'reflective'] as const).map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => onUpdateReminderSettings({ tone })}
                      className={`min-h-[38px] rounded-md px-2 text-xs font-semibold capitalize transition-colors ${
                        state.reminders.tone === tone
                          ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-950 dark:text-zinc-100'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {state.reminders.browserPermission !== 'granted' &&
                state.reminders.browserPermission !== 'unsupported' && (
                  <button
                    type="button"
                    onClick={onEnableBrowserNotifications}
                    className="min-h-[42px] w-full rounded-lg border border-blue-900/30 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-950 transition-colors hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-200"
                  >
                    Allow Browser Push Alerts
                  </button>
                )}
            </div>
          </div>

          {/* Personalization & Appearance */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-100">
              Personalization
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="reader-name" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  First name (for personal notes)
                </label>
                <input
                  id="reader-name"
                  type="text"
                  maxLength={40}
                  value={state.preferences.name}
                  onChange={(e) => onUpdatePreferences({ name: e.target.value })}
                  placeholder="Optional"
                  className="mt-1.5 min-h-[42px] w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-900 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Daily reading goal
                </p>
                <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
                  {(
                    [
                      { id: 'verse', label: '1 Verse' },
                      { id: 'chapter', label: '1 Chapter' },
                      { id: 'ten_minutes', label: '10 Mins' },
                    ] as { id: DailyGoal; label: string }[]
                  ).map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => onUpdatePreferences({ dailyGoal: g.id })}
                      className={`min-h-[38px] rounded-md px-2 text-xs font-semibold transition-colors ${
                        state.preferences.dailyGoal === g.id
                          ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-950 dark:text-zinc-100'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Preferred translation
                </p>
                <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
                  {(['WEB', 'KJV'] as Translation[]).map((tr) => (
                    <button
                      key={tr}
                      type="button"
                      onClick={() => onUpdatePreferences({ translation: tr })}
                      className={`min-h-[38px] rounded-md px-2 text-xs font-semibold transition-colors ${
                        state.preferences.translation === tr
                          ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-950 dark:text-zinc-100'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {tr === 'WEB' ? 'World English (WEB)' : 'King James (KJV)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Focus themes
                </p>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_TOPICS.map((topic) => {
                    const active = state.preferences.focusTopics.includes(topic.id);
                    const ink = getTopicInk(topic.id);
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => onToggleTopic(topic.id)}
                        className={`min-h-[36px] rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                          active ? ink.activeButton : ink.inactiveButton
                        }`}
                      >
                        {topic.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Reading appearance
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePreferences({
                      theme: state.preferences.theme === 'dark' ? 'light' : 'dark',
                    })
                  }
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-zinc-200 px-3.5 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {state.preferences.theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4" /> Switch to Light
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" /> Switch to Dark
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Local Backup & Portability */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-serif text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Data Backup
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Your streaks, highlights, and reflections are stored privately on this device. Export a backup anytime.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onExportJson}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-zinc-200 px-3.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-zinc-200 px-3.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Upload className="h-4 w-4" />
                Restore Backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
