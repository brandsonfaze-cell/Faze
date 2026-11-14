import { BarChart3, Bell, BookOpen, Sun } from 'lucide-react';
import { AppTab } from '../types/bible';

interface TopNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  completedToday: boolean;
  onPrimaryAction: () => void;
  unreadNotifications: number;
}

const NAV_ITEMS: { id: AppTab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'scripture', label: 'Scripture' },
  { id: 'progress', label: 'Progress' },
  { id: 'reminders', label: 'Reminders' },
];

export function TopNav({
  activeTab,
  onSelectTab,
  completedToday,
  onPrimaryAction,
  unreadNotifications,
}: TopNavProps) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => onSelectTab('today')}
            className="font-editorial shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight text-blue-950 focus-visible:outline-2 focus-visible:outline-blue-900 dark:text-amber-200"
          >
            Selah
          </button>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-7 md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`relative shrink-0 whitespace-nowrap py-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-900 ${
                    isActive
                      ? 'text-blue-900 underline decoration-amber-700 decoration-2 underline-offset-8 dark:text-amber-300 dark:decoration-amber-400'
                      : 'text-zinc-700 hover:text-blue-900 dark:text-zinc-300 dark:hover:text-amber-200'
                  }`}
                >
                  {item.label}
                  {item.id === 'reminders' && unreadNotifications > 0 && (
                    <span className="ml-1.5 font-mono text-xs tabular-nums text-rose-800 dark:text-rose-400">
                      ({unreadNotifications})
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onPrimaryAction}
              className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900 ${
                completedToday
                  ? 'border border-zinc-200 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800'
                  : 'bg-blue-900 text-white hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-600'
              }`}
            >
              {completedToday ? 'Read Scripture' : 'Complete Today'}
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
      >
        <div className="grid h-16 grid-cols-4 items-center">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon =
              item.id === 'today'
                ? Sun
                : item.id === 'scripture'
                ? BookOpen
                : item.id === 'progress'
                ? BarChart3
                : Bell;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-1 px-2 text-[11px] font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-blue-900 dark:text-blue-400'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>
                  {item.label}
                  {item.id === 'reminders' && unreadNotifications > 0
                    ? ` (${unreadNotifications})`
                    : ''}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
