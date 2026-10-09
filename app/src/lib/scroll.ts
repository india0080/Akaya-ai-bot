/** Scrolls a horizontal chip row so its selected chip sits in the middle (no vertical scroll). */
export function centerSelected(row: HTMLElement | null, selector: string) {
  const chip = row?.querySelector<HTMLElement>(selector);
  if (row && chip)
    row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
}
