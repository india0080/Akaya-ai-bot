import type { BubbleColor } from '../../content/types';

const files = import.meta.glob('../../assets/img/*.webp', { eager: true, import: 'default', query: '?url' }) as Record<string, string>;
const byName = Object.fromEntries(Object.entries(files).map(([k, v]) => [k.split('/').pop()!.replace('.webp', ''), v]));

export const imageUrl = (name: string): string => {
  const url = byName[name];
  if (!url) throw new Error(`Missing image asset: ${name}.webp`);
  return url;
};
export const bubbleUrl = (c: BubbleColor) => imageUrl(`akaya-bubble-${c}`);
export const logoUrl = () => imageUrl('logo');
