import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) { return twMerge(clsx(inputs)); }
export const localDateStr = (d = new Date()) => new Intl.DateTimeFormat('en-CA').format(d);
export const getLocalWeekday = () => new Intl.DateTimeFormat('en-US',{weekday:'long'}).format(new Date()).toLowerCase();
export function calcStreak(logs) {
  if (!logs?.length) return 0;
  const dates = [...new Set(logs.map(l => {
    const raw = l.completedAt?.toDate ? l.completedAt.toDate() : new Date(l.completedAt || l.createdAt || Date.now());
    return localDateStr(raw);
  }))].sort().reverse();
  let streak = 0;
  for (let i = 0; i < 90; i++) {
    const check = localDateStr(new Date(Date.now() - i * 86400000));
    if (dates.includes(check)) streak++;
    else if (i > 0) break;
  }
  return streak;
}
