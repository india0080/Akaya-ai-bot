import { HeadsUp } from '@akaya/ui';
import { useStore } from '../state';

/** Live notification banner (shared HeadsUp UI; this file only maps notification kinds to icons). */
export function NotifBanner() {
  const { latest, dismissLatest } = useStore();
  return (
    <HeadsUp
      item={latest}
      onDismiss={dismissLatest}
      source="Akaya Shopping"
      fallback="/alerts"
      icon={latest?.kind === 'price_drop' ? 'tag' : 'bell'}
      tone={'green'}
    />
  );
}
