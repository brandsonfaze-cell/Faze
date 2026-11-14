import { FocusTopic } from '../types/bible';

export interface TopicInkStyle {
  text: string;
  heading: string;
  activeButton: string;
  inactiveButton: string;
  tintBg: string;
  border: string;
}

export const TOPIC_INK_STYLES: Record<FocusTopic, TopicInkStyle> = {
  peace: {
    text: 'text-emerald-800 dark:text-emerald-300',
    heading: 'text-emerald-950 dark:text-emerald-200',
    activeButton: 'border-emerald-800 bg-emerald-800 text-white dark:border-emerald-600 dark:bg-emerald-700',
    inactiveButton:
      'border-emerald-200/80 bg-emerald-50/40 text-emerald-900 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300 dark:hover:bg-emerald-950/40',
    tintBg: 'bg-emerald-50/60 dark:bg-emerald-950/25',
    border: 'border-emerald-200 dark:border-emerald-800/60',
  },
  wisdom: {
    text: 'text-amber-800 dark:text-amber-300',
    heading: 'text-amber-950 dark:text-amber-200',
    activeButton: 'border-amber-800 bg-amber-800 text-white dark:border-amber-600 dark:bg-amber-700',
    inactiveButton:
      'border-amber-200/80 bg-amber-50/40 text-amber-900 hover:bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300 dark:hover:bg-amber-950/40',
    tintBg: 'bg-amber-50/60 dark:bg-amber-950/25',
    border: 'border-amber-200 dark:border-amber-800/60',
  },
  gratitude: {
    text: 'text-orange-800 dark:text-orange-300',
    heading: 'text-orange-950 dark:text-orange-200',
    activeButton: 'border-orange-800 bg-orange-800 text-white dark:border-orange-600 dark:bg-orange-700',
    inactiveButton:
      'border-orange-200/80 bg-orange-50/40 text-orange-900 hover:bg-orange-50 dark:border-orange-900/60 dark:bg-orange-950/20 dark:text-orange-300 dark:hover:bg-orange-950/40',
    tintBg: 'bg-orange-50/60 dark:bg-orange-950/25',
    border: 'border-orange-200 dark:border-orange-800/60',
  },
  strength: {
    text: 'text-blue-900 dark:text-blue-300',
    heading: 'text-blue-950 dark:text-blue-200',
    activeButton: 'border-blue-900 bg-blue-900 text-white dark:border-blue-600 dark:bg-blue-700',
    inactiveButton:
      'border-blue-200/80 bg-blue-50/40 text-blue-900 hover:bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-300 dark:hover:bg-blue-950/40',
    tintBg: 'bg-blue-50/60 dark:bg-blue-950/25',
    border: 'border-blue-200 dark:border-blue-800/60',
  },
  grace: {
    text: 'text-rose-800 dark:text-rose-300',
    heading: 'text-rose-950 dark:text-rose-200',
    activeButton: 'border-rose-800 bg-rose-800 text-white dark:border-rose-600 dark:bg-rose-700',
    inactiveButton:
      'border-rose-200/80 bg-rose-50/40 text-rose-900 hover:bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300 dark:hover:bg-rose-950/40',
    tintBg: 'bg-rose-50/60 dark:bg-rose-950/25',
    border: 'border-rose-200 dark:border-rose-800/60',
  },
  gospels: {
    text: 'text-indigo-900 dark:text-indigo-300',
    heading: 'text-indigo-950 dark:text-indigo-200',
    activeButton: 'border-indigo-900 bg-indigo-900 text-white dark:border-indigo-600 dark:bg-indigo-700',
    inactiveButton:
      'border-indigo-200/80 bg-indigo-50/40 text-indigo-900 hover:bg-indigo-50 dark:border-indigo-900/60 dark:bg-indigo-950/20 dark:text-indigo-300 dark:hover:bg-indigo-950/40',
    tintBg: 'bg-indigo-50/60 dark:bg-indigo-950/25',
    border: 'border-indigo-200 dark:border-indigo-800/60',
  },
  psalms: {
    text: 'text-teal-800 dark:text-teal-300',
    heading: 'text-teal-950 dark:text-teal-200',
    activeButton: 'border-teal-800 bg-teal-800 text-white dark:border-teal-600 dark:bg-teal-700',
    inactiveButton:
      'border-teal-200/80 bg-teal-50/40 text-teal-900 hover:bg-teal-50 dark:border-teal-900/60 dark:bg-teal-950/20 dark:text-teal-300 dark:hover:bg-teal-950/40',
    tintBg: 'bg-teal-50/60 dark:bg-teal-950/25',
    border: 'border-teal-200 dark:border-teal-800/60',
  },
};

export function getTopicInk(topic: FocusTopic): TopicInkStyle {
  return TOPIC_INK_STYLES[topic] ?? TOPIC_INK_STYLES.peace;
}
