import type { Section, SectionVisual } from '../../content/types';

/** Picks a visual from the data shape so imported/admin content renders well without per-page code. */
export function pickVisual(s: Section, legal: boolean): SectionVisual {
  if (s.visual) return s.visual;
  if (s.faqs?.length) return 'faq';
  if (legal) return 'prose';
  const withText = s.items?.filter((i) => i.text).length ?? 0;
  if (withText >= 2) return 'cards';
  if ((s.items?.length ?? 0) >= 2) return 'steps';
  return 'split-phones';
}
