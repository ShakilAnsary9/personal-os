export const DAY = 86400000;

export const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const MO = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export function dkey(d: Date | string): string {
  const x = d instanceof Date ? d : new Date(d);
  return (
    x.getFullYear() +
    '-' +
    String(x.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(x.getDate()).padStart(2, '0')
  );
}

export function todayKey(): string {
  return dkey(new Date());
}

export function fromKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fmtShort(k: string): string {
  return fromKey(k).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function fmtLong(k: string): string {
  return fromKey(k).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function monthKey(k: string): string {
  return k.slice(0, 7);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / DAY);
}
