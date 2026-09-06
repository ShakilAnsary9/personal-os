import type { Project, Task } from '@/types';
import { isRecurring } from './tasks';
import { toPKR } from './money';

export function projectProgress(p: Project, tasks: Task[]): { pct: number; done: number; total: number } {
  const ts = tasks.filter((t) => t.projectId === p.id && !isRecurring(t));
  if (!ts.length) return { pct: 0, done: 0, total: 0 };
  const done = ts.filter((t) => t.done).length;
  return { pct: Math.round((done / ts.length) * 100), done, total: ts.length };
}

export function projProfit(p: Project, usdRate: number): number | null {
  if (p.price == null && p.outsourceCost == null) return null;
  return toPKR((p.price || 0) - (p.outsourceCost || 0), p.currency || 'PKR', usdRate);
}
