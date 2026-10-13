import type { BubbleColor } from '../../content/types';
import { bubbleUrl } from './assets';

interface Props { color: BubbleColor; size?: number; className?: string; eager?: boolean; alt?: string }

/** Akaya minimal bubble (satin sphere, black eyes only). */
export function Bubble({ color, size = 56, className = 'bubble', eager, alt = '' }: Props) {
  return <img className={className} src={bubbleUrl(color)} width={size} height={size} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}
