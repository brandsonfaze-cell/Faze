import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import { ActiveToast } from '../hooks/useBibleProgress';

interface EncouragementToastProps {
  toast: ActiveToast | null;
  onDismiss: () => void;
}

export function EncouragementToast({ toast, onDismiss }: EncouragementToastProps) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-20 right-4 left-4 z-50 flex justify-end md:bottom-6 md:left-auto md:right-6"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-blue-900 dark:text-blue-400" />
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {toast.title}
                  </p>
                  {typeof toast.xpDelta === 'number' && toast.xpDelta > 0 && (
                    <span className="font-mono text-xs font-semibold tabular-nums text-emerald-800 dark:text-emerald-400">
                      +{toast.xpDelta} XP
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss notification"
                className="flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-blue-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
