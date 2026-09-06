import type { Content } from '@/types';

export function genThumb(c: Partial<Content>): string {
  const lines: string[] = [];
  lines.push('THUMBNAIL BRIEF \u2014 ' + (c.title || 'Untitled'));
  lines.push('\u2500'.repeat(34));
  if (c.tnBigText) lines.push('BIG TEXT:  ' + c.tnBigText.toUpperCase());
  if (c.tnSubText) lines.push('SUB TEXT:  ' + c.tnSubText);
  if (c.tnEmotion) lines.push('FACE:      ' + c.tnEmotion);
  if (c.tnColors) lines.push('COLORS:    ' + c.tnColors);
  if (c.tnObjects) lines.push('OBJECTS:   ' + c.tnObjects);
  if (c.tnLayout) lines.push('LAYOUT:    ' + c.tnLayout);
  lines.push('');
  lines.push('CONTRAST CHECK: bold text, dark outline, readable at small size.');
  if (c.hook) lines.push('HOOK TIE-IN:   "' + c.hook + '"');
  return lines.join('\n');
}
