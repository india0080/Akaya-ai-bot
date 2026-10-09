/** Akaya custom icon set (24x24, 1.9 stroke). Paths are static trusted markup. */
import type { CSSProperties } from 'react';

const PATHS = {
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.2"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:
    '<path d="M3.5 3.5l17 17M10.6 6.1c.5-.1.9-.1 1.4-.1 6 0 9.5 6 9.5 6a16.4 16.4 0 0 1-3 3.7M6.6 7.6A15.8 15.8 0 0 0 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  alert: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.8v5M12 16.1v.1"/>',
  home: '<path d="M3.5 10.5 12 3.5l8.5 7V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.8H9.2v5.8H5A1.5 1.5 0 0 1 3.5 19z"/>',
  chat: '<path d="M20.5 11.6a8.3 8.3 0 0 1-12.1 7.4L3.8 20.3l1.2-4.3a8.3 8.3 0 1 1 15.5-4.4z"/>',
  mic: '<rect x="9" y="3" width="6" height="11.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  more: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
  bell: '<path d="M6 9.5a6 6 0 0 1 12 0c0 5.5 2.3 7 2.3 7H3.7S6 15 6 9.5zM10 20a2.1 2.1 0 0 0 4 0"/>',
  float:
    '<circle cx="12" cy="12" r="8.6"/><circle cx="9.2" cy="11.6" r="1.5" fill="currentColor"/><circle cx="14.8" cy="11.6" r="1.5" fill="currentColor"/>',
  ask: '<path d="M20.5 11.6a8.3 8.3 0 0 1-12.1 7.4L3.8 20.3l1.2-4.3a8.3 8.3 0 1 1 15.5-4.4z"/><path d="M12 7.6l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="currentColor" stroke-width="1"/>',
  future:
    '<path d="M20.5 3.5 3 10l6.5 2.6M20.5 3.5 9.5 12.6M20.5 3.5l-3 8.3M9.5 12.6l1.8 6.4 1.9-3.3"/><circle cx="17.3" cy="17.3" r="4"/><path d="M17.3 15.6v1.9l1.2.8"/>',
  read: '<path d="M4 8.5V5.5A1.5 1.5 0 0 1 5.5 4h3M15.5 4h3A1.5 1.5 0 0 1 20 5.5v3M20 15.5v3a1.5 1.5 0 0 1-1.5 1.5h-3M8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3M8 10h8M8 14h5"/>',
  translate:
    '<path d="M3.5 5.5h9M8 3.5v2M5.5 5.5c.9 3.4 3 5.8 6 7.2M10.5 5.5c-.8 3.7-3 6.5-6.5 8.2M12.5 20.5l4-9 4 9M13.9 17.4h5.2"/>',
  alarm: '<circle cx="12" cy="13" r="7.2"/><path d="M12 9.6v3.6l2.3 1.5M4.8 3.8 2.8 5.8M19.2 3.8l2 2"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="8.5" cy="14.5" r=".9" fill="currentColor"/><circle cx="12" cy="14.5" r=".9" fill="currentColor"/>',
  follow: '<path d="M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1M17.8 3.6v3.6h-3.6M6.2 20.4v-3.6h3.6"/>',
  agent:
    '<rect x="4.5" y="8" width="15" height="11.5" rx="3.5"/><path d="M12 4.6V8M9.4 12.8v1.6M14.6 12.8v1.6M2.5 12.5v3.2M21.5 12.5v3.2"/><circle cx="12" cy="3.6" r="1.1"/>',
  explore: '<circle cx="12" cy="12" r="8.6"/><path d="M15.6 8.4 13.6 13.6 8.4 15.6 10.4 10.4z"/>',
  loan: '<rect x="3.5" y="5" width="17" height="14.5" rx="3"/><path d="M14.5 10.2h6v4.6h-6a2.3 2.3 0 0 1 0-4.6z"/>',
  note: '<path d="M6.5 3.5h7.8l4.2 4.2v11.8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M14 3.7V8h4.3M9 12.5h6M9 16h4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  chev: '<path d="M9.5 6l6 6-6 6"/>',
  back: '<path d="M14.5 6l-6 6 6 6"/>',
  send: '<path d="M4 11.8 20.5 4l-6 16.5-3.2-6.9z"/><path d="M11.3 13.6 20.5 4"/>',
  check: '<path d="M5 12.6l4.4 4.4L19 7.4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chip: '<rect x="7" y="7" width="10" height="10" rx="2.2"/><path d="M10 3.5V7M14 3.5V7M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5"/>',
  globe:
    '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2M12 3.4c2.4 2.5 3.6 5.4 3.6 8.6s-1.2 6.1-3.6 8.6c-2.4-2.5-3.6-5.4-3.6-8.6S9.6 5.9 12 3.4z"/>',
  clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.5V12l3 2"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4 7l8 6 8-6"/>',
  user: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/>',
  phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.8"/><path d="M10.5 18.5h3"/>',
  bolt: '<path d="M13 2.8 5.5 13.2h6L10.8 21.2l7.7-10.6h-6z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4"/>',
  spark:
    '<path d="M12 2.5c.6 4.6 2.9 7 9.5 9.5-6.6 2.5-8.9 4.9-9.5 9.5-.6-4.6-2.9-7-9.5-9.5 6.6-2.5 8.9-4.9 9.5-9.5z" fill="currentColor" stroke="none"/>',
  dots: '<circle cx="6" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18" cy="12" r="1.4" fill="currentColor"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  trash:
    '<path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.2a1.5 1.5 0 0 0 1.5 1.3h6.2a1.5 1.5 0 0 0 1.5-1.3L17.5 7M10 11v6M14 11v6"/>',
  swap: '<path d="M7 4 3.5 7.5 7 11M3.5 7.5h13M17 13l3.5 3.5L17 20M20.5 16.5h-13"/>',
  copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.5"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>',
  volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  monitor: '<rect x="3" y="4.5" width="18" height="12" rx="2.5"/><path d="M9 20.5h6M12 16.5v4"/>',
  logout: '<path d="M14.5 4.5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3M10 16.5 5.5 12 10 7.5M5.5 12h10"/>',
  help: '<circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.5a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6M12 17h.01"/>',
  crown: '<path d="M3.5 8 7.5 12 12 5l4.5 7 4-4-1.8 10.5H5.3z"/>',
  history: '<path d="M3.8 12a8.2 8.2 0 1 0 2.4-5.8M3.5 4v4.2h4.2"/><path d="M12 8v4.3l3 1.8"/>',
  text: '<path d="M4 7V5h12v2M10 5v14M7.5 19h5M14 12v-1.5h7V12M17.5 10.5V19M16 19h3"/>',
  gauge:
    '<path d="M4.5 17a8.5 8.5 0 1 1 15 0"/><path d="M12 13.5l4-4.5"/><circle cx="12" cy="14" r="1.4" fill="currentColor"/>',
  lang: '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2M12 3.4c2.4 2.5 3.6 5.4 3.6 8.6s-1.2 6.1-3.6 8.6c-2.4-2.5-3.6-5.4-3.6-8.6S9.6 5.9 12 3.4z"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="2.5" fill="currentColor"/>',
  keyboard:
    '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M7 10h.01M10.5 10h.01M14 10h.01M17.5 10h.01M8 14h8"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15h.01M8.5 18h.01M12 18h.01"/>',
  image:
    '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m20.5 16-5-5-8.5 8.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  filter: '<path d="M4 5.5h16l-6.2 7.3v5.4l-3.6 1.8v-7.2z"/>',
  pin: '<path d="M9 3.5h6l-1 5.5 3.5 3.5v1.5h-11v-1.5L10 9z"/><path d="M12 14v6.5"/>',
  open: '<path d="M13.5 4.5H19.5V10.5M19.5 4.5 11 13M17 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 4 18.5v-10A1.5 1.5 0 0 1 5.5 7H10"/>',
  reply: '<path d="M10 5 4 11l6 6M4.5 11H14a6 6 0 0 1 6 6v1.5"/>',
  plug: '<path d="M9 3.5V8M15 3.5V8M6.5 8h11v3.5a5.5 5.5 0 0 1-11 0zM12 17v3.5"/>',
  apps: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="3.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><path d="M17 13.5v7M13.5 17h7"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  shield: '<path d="M12 3.5 19 6v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  play: '<path d="M7.5 4.8v14.4a.8.8 0 0 0 1.2.7l11.3-7.2a.8.8 0 0 0 0-1.4L8.7 4.1a.8.8 0 0 0-1.2.7z"/>',
  pause: '<rect x="6" y="4.5" width="4" height="15" rx="1.3"/><rect x="14" y="4.5" width="4" height="15" rx="1.3"/>',
  bookmark: '<path d="M6.5 4.5A1.5 1.5 0 0 1 8 3h8a1.5 1.5 0 0 1 1.5 1.5v16L12 16.5l-5.5 4z"/>',
  share:
    '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/>',
  download: '<path d="M12 3.5v11.5M7.5 10.5 12 15l4.5-4.5M4.5 16.5v2A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-2"/>',
  back5:
    '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 3.5v3.7h3.7"/><text x="12" y="15.3" font-size="7.6" font-weight="800" text-anchor="middle" fill="currentColor" stroke="none" font-family="Manrope,sans-serif">5</text>',
  fwd5: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 3.5v3.7h-3.7"/><text x="12" y="15.3" font-size="7.6" font-weight="800" text-anchor="middle" fill="currentColor" stroke="none" font-family="Manrope,sans-serif">5</text>',
  mindmap:
    '<circle cx="12" cy="12" r="2.6"/><circle cx="4.8" cy="5.5" r="1.9"/><circle cx="19.2" cy="5.5" r="1.9"/><circle cx="4.8" cy="18.5" r="1.9"/><circle cx="19.2" cy="18.5" r="1.9"/><path d="M10 10.3 6.3 6.9M14 10.3l3.7-3.4M10 13.7l-3.7 3.4M14 13.7l3.7 3.4"/>',
  list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r="1.2" fill="currentColor"/><circle cx="4.8" cy="12" r="1.2" fill="currentColor"/><circle cx="4.8" cy="17.5" r="1.2" fill="currentColor"/>',
  task: '<rect x="3.5" y="4" width="17" height="16.5" rx="3.5"/><path d="M8 12.2l2.8 2.8L16.5 9.3"/>',
  cap: '<path d="M2.5 9.5 12 5l9.5 4.5L12 14z"/><path d="M6.5 11.5v4.3c0 1.5 2.5 2.7 5.5 2.7s5.5-1.2 5.5-2.7v-4.3M21.5 9.5v5"/>',
  users:
    '<circle cx="9" cy="8.5" r="3.3"/><path d="M3 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2"/><circle cx="16.8" cy="9.3" r="2.6"/><path d="M16.5 14.3c2.4.2 4 1.8 4.5 4.6"/>',
  brief:
    '<rect x="3.5" y="7" width="17" height="12.5" rx="2.5"/><path d="M8.5 7V5.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5V7M3.5 12.5h17M10.5 12.5v1.5h3v-1.5"/>',
  bulb: '<path d="M9 17.5h6M10 20.5h4M12 3.5a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2v1.2h5.2v-1.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3.5z"/>',
  podcast:
    '<circle cx="12" cy="10" r="2.2"/><path d="M8.2 14.2a5.5 5.5 0 1 1 7.6 0M5.4 17a9.3 9.3 0 1 1 13.2 0M12 13v8"/>',
  wave: '<path d="M3 12h1.5M6.5 8.5v7M10 5v14M13.5 8v8M17 10v4M20.5 12H21"/>',
  memo: '<rect x="9" y="3" width="6" height="11.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/><path d="M2.5 7v4M21.5 7v4" />',
} as const;

export type IconName = keyof typeof PATHS;

interface Props {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
  /** soft tinted fill (used for active nav icons) */
  fill?: boolean;
}

export function Icon({ name, size = 20, strokeWidth = 1.9, className, style, fill = false }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={fill ? 'currentColor' : 'none'}
      fillOpacity={fill ? 0.22 : undefined}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: 'none', ...style }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}
