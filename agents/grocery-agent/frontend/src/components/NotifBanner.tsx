import { HeadsUp } from '@akaya/ui';
import { useStore } from '../state';

/** Live notification banner (shared HeadsUp UI; this file only maps notification kinds to icons). */
export function NotifBanner() {
  const { latest, dismissLatest } = useStore();
  return (
    <HeadsUp
      item={latest}
      onDismiss={dismissLatest}
      source="Akaya Grocery"
      fallback="/orders"
      icon={
        latest?.kind === 'ready_to_pay'
          ? 'wallet'
          : latest?.kind === 'order'
            ? 'truck'
            : latest?.kind === 'list_ready'
              ? 'basket'
              : 'bell'
      }
      tone={latest?.kind === 'ready_to_pay' ? 'orange' : 'green'}
    />
  );
}
