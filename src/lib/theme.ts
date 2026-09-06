export const PALETTE = [
  '#E8432D',
  '#206B58',
  '#EFA72C',
  '#2E6C8E',
  '#7A3B6B',
  '#C43420',
  '#4A5044',
] as const;

export const MARKET_COLORS = [
  'var(--blue)',
  'var(--pine)',
  'var(--gold)',
  'var(--plum)',
  'var(--red)',
  'var(--blue)',
] as const;

export const MARKET_SOFT = [
  'var(--blue-soft)',
  'var(--pine-soft)',
  'var(--gold-soft)',
  'var(--plum-soft)',
  'var(--red-soft)',
  'var(--blue-soft)',
] as const;

export const HABIT_ICONS = [
  '\u2726', '\u2615', '\u25B6', '\u270E', '\u260E',
  '\u2691', '\u2665', '\u25CE', '\u26A1', '\u25C6',
] as const;

export const NOTE_COLORS = [
  ['y', 'cd-y'],
  ['r', 'cd-r'],
  ['g', 'cd-g'],
  ['b', 'cd-b'],
  ['p', 'cd-p'],
  ['o', 'cd-o'],
] as const;

export function marketColor(m: string, soft?: boolean, markets?: string[]): string {
  const i = (markets || []).indexOf(m);
  const idx = i >= 0 ? i : (markets || []).length;
  return soft
    ? MARKET_SOFT[idx % MARKET_SOFT.length]
    : MARKET_COLORS[idx % MARKET_COLORS.length];
}

export function personColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

export function initials(name: string): string {
  return (name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
