import type { Habit } from '@/types';
import { fromKey, todayKey } from './dates';

export function habitDueOn(h: Habit, key: string): boolean {
  const d = fromKey(key).getDay();
  return !h.days || h.days.length === 7 ? true : h.days.includes(d);
}

export function habitStreak(h: Habit): { cur: number; best: number; total: number } {
  let best = 0;
  let run = 0;

  // Best streak over last 365 days
  const start = new Date();
  start.setDate(start.getDate() - 365);
  for (let d = new Date(start); d <= new Date(); d.setDate(d.getDate() + 1)) {
    const k = fromKey(d.toISOString().slice(0, 10)).toISOString().slice(0, 10);
    // Use dkey format
    const dk =
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0');
    if (!habitDueOn(h, dk)) continue;
    if (h.log && h.log[dk]) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  // Current streak (going backwards from today)
  let cur = 0;
  let d = new Date();
  let graced = false;
  for (let i = 0; i < 400; i++) {
    const dk =
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0');
    if (habitDueOn(h, dk)) {
      if (h.log && h.log[dk]) {
        cur++;
      } else if (dk === todayKey() && !graced) {
        graced = true;
      } else {
        break;
      }
    }
    d.setDate(d.getDate() - 1);
  }

  return {
    cur,
    best,
    total: h.log ? Object.keys(h.log).length : 0,
  };
}
