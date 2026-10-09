import { disclosureText, hasProgramme, type BuiltLink } from '@akaya/affiliate';
import { Icon, useToast, type IconName } from '@akaya/ui';
import { AppTile } from '../components/AppTile';
import { openExternal } from '../native/openExternal';
import { platformBrand, platformName } from './links';
import './commerce.css';

/** "Book on Booking.com" / "Open in Swiggy": opens the app or site (see native/openExternal). */
export function OpenButton({
  link,
  label,
  variant = 'brand',
  icon = 'external',
  className = '',
}: {
  link: BuiltLink;
  label?: string;
  variant?: 'brand' | 'primary' | 'ghost' | 'outline';
  icon?: IconName;
  className?: string;
}) {
  const toast = useToast();
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      onClick={async () => {
        const via = await openExternal(link);
        if (via === 'in-app-browser')
          toast(`${platformName(link.platform)} app not found · opened the website`, 'globe');
      }}
    >
      {label ?? `Open in ${platformName(link.platform)}`} <Icon name={icon} size={15} />
    </button>
  );
}

/** "Akaya may earn a commission": shown next to buttons for platforms that have an affiliate programme */
export function Disclosure({ platforms, className = '' }: { platforms: string[]; className?: string }) {
  if (!platforms.some(hasProgramme)) return null;
  return (
    <p className={`aff-note ${className}`}>
      <Icon name="help" size={12} /> {disclosureText()}
    </p>
  );
}

/** brand tile for a registry platform */
export function PlatformTile({ id, size = 28 }: { id: string; size?: number }) {
  return <AppTile app={platformBrand(id)} size={size} />;
}

/** small "SAMPLE" label for demo data */
export function SampleTag({ text = 'SAMPLE DATA' }: { text?: string }) {
  return <span className="tag sample-tag">{text}</span>;
}
