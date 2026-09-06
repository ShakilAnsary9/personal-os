import type { Task } from '@/types';
import { fromKey, todayKey, daysBetween } from './dates';

export function taskDueOn(t: Task, key: string): boolean {
  const d = fromKey(key).getDay();
  if (t.repeat === 'daily') return true;
  if (t.repeat === 'weekdays') return d >= 1 && d <= 5;
  if (t.repeat === 'weekly') return (t.days || []).includes(d);
  return t.due === key;
}

export function isRecurring(t: Task): boolean {
  return !!t.repeat && t.repeat !== 'once';
}

export function taskDoneOn(t: Task, key: string): boolean {
  return isRecurring(t) ? !!(t.log && t.log[key]) : !!t.done;
}

export function todaysTasks(tasks: Task[]): Array<{ t: Task; key: string; overdue: boolean }> {
  const key = todayKey();
  const list: Array<{ t: Task; key: string; overdue: boolean }> = [];

  tasks.forEach((t) => {
    if (isRecurring(t)) {
      if (taskDueOn(t, key)) list.push({ t, key, overdue: false });
    } else if (!t.done && t.due) {
      if (t.due === key) list.push({ t, key, overdue: false });
      else if (t.due < key) list.push({ t, key, overdue: true });
    }
  });

  return list.sort(
    (a, b) =>
      (taskDoneOn(a.t, key) ? 1 : 0) - (taskDoneOn(b.t, key) ? 1 : 0) ||
      (b.overdue ? 1 : 0) - (a.overdue ? 1 : 0),
  );
}

export function upcomingDeadlines(tasks: Task[]): Task[] {
  const key = todayKey();
  return tasks
    .filter(
      (t) => !isRecurring(t) && !t.done && t.due && t.due >= key && daysBetween(key, t.due) <= 3,
    )
    .sort((a, b) => (a.due! < b.due! ? -1 : 1));
}

export function repeatLabel(t: Task): string | null {
  if (t.repeat === 'daily') return 'daily';
  if (t.repeat === 'weekdays') return 'weekdays';
  if (t.repeat === 'weekly')
    return 'weekly \u00B7 ' + (t.days || []).map((d) => WD[d]).join(' ');
  return null;
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
