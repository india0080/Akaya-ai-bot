/**
 * Attachment pickers for the Chat "+" sheet. Each returns Attachment[] (empty if cancelled) or throws
 * an Error with a user-facing message (e.g. permission denied).
 * Native (APK): Capacitor Camera / Geolocation (they ask for runtime permission);
 * Photos & Files use the system picker through the WebView file chooser.
 */
import { Capacitor } from '@capacitor/core';
import { uid } from '../lib/time';
import { extOf, fileThumb, imageThumb, pickFiles } from '../lib/media';
import type { Attachment } from '../state/types';

const native = Capacitor.isNativePlatform();

export const DOC_ACCEPT = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
  'application/pdf',
  'text/plain',
  'text/csv',
].join(',');

async function fromFiles(files: File[], kind?: Attachment['kind'], filter?: string): Promise<Attachment[]> {
  return Promise.all(
    files.map(async (f) => {
      const isImg = f.type.startsWith('image/');
      const isVid = f.type.startsWith('video/');
      const k: Attachment['kind'] =
        kind ?? (isImg ? 'image' : isVid ? 'video' : f.type.startsWith('audio/') ? 'audio' : 'file');
      return {
        id: uid(),
        kind: k,
        name: f.name || `${k}-${Date.now()}`,
        mime: f.type || undefined,
        size: f.size,
        thumb: isImg || isVid ? await fileThumb(f, 360, filter) : undefined,
        meta: !isImg && !isVid ? extOf(f.name) : undefined,
      };
    }),
  );
}

const stamp = () => {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`;
};

async function nativePhoto(filter?: string): Promise<string | null> {
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  let perm = await Camera.checkPermissions();
  if (perm.camera !== 'granted') perm = await Camera.requestPermissions({ permissions: ['camera'] });
  if (perm.camera === 'denied') throw new Error('Camera permission is off. Turn it on in Settings › Apps › Akaya.');
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      quality: 75,
      width: 1600,
      correctOrientation: true,
    });
    return photo.dataUrl ? await imageThumb(photo.dataUrl, 360, filter) : null;
  } catch (e) {
    if (/cancel/i.test(String(e))) return null;
    throw e;
  }
}

export async function pickCamera(): Promise<Attachment[]> {
  if (native) {
    const thumb = await nativePhoto();
    return thumb ? [{ id: uid(), kind: 'image', name: `IMG_${stamp()}.jpg`, mime: 'image/jpeg', thumb }] : [];
  }
  return fromFiles(await pickFiles('image/*', false, 'environment'), 'image');
}

export async function pickPhotos(): Promise<Attachment[]> {
  return fromFiles((await pickFiles('image/*,video/*', true)).slice(0, 10));
}

export async function pickDocs(): Promise<Attachment[]> {
  return fromFiles((await pickFiles(DOC_ACCEPT, true)).slice(0, 10), 'file');
}

/** "scan": photo of a document, cleaned up to a high-contrast greyscale page */
export async function pickScan(): Promise<Attachment[]> {
  const filter = 'grayscale(1) contrast(1.6) brightness(1.12)';
  if (native) {
    const thumb = await nativePhoto(filter);
    return thumb
      ? [{ id: uid(), kind: 'scan', name: `Scan_${stamp()}.jpg`, mime: 'image/jpeg', thumb, meta: 'Scanned page' }]
      : [];
  }
  const files = await pickFiles('image/*', false, 'environment');
  return (await fromFiles(files, 'scan', filter)).map((a) => ({
    ...a,
    name: `Scan_${stamp()}.jpg`,
    meta: 'Scanned page',
  }));
}

/** a screenshot for Akaya to read */
export async function pickScreenshot(): Promise<Attachment[]> {
  return (await fromFiles(await pickFiles('image/*', false), 'screen')).map((a) => ({
    ...a,
    meta: 'Screenshot to read',
  }));
}

export async function pickLocation(): Promise<Attachment[]> {
  let lat: number;
  let lng: number;
  let acc: number;
  if (native) {
    const { Geolocation } = await import('@capacitor/geolocation');
    let perm = await Geolocation.checkPermissions().catch(() => null);
    if (!perm || perm.location !== 'granted')
      perm = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
    if (perm.location === 'denied' && perm.coarseLocation === 'denied')
      throw new Error('Location permission is off. Turn it on in Settings › Apps › Akaya.');
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
    ({ latitude: lat, longitude: lng, accuracy: acc } = pos.coords);
  } else {
    if (!('geolocation' in navigator)) throw new Error('Location is not available on this device.');
    const pos = await new Promise<GeolocationPosition>((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 15000, maximumAge: 60000 }),
    ).catch((e: GeolocationPositionError) => {
      throw new Error(e.code === 1 ? 'Location permission was denied.' : 'Could not get your location.');
    });
    ({ latitude: lat, longitude: lng, accuracy: acc } = pos.coords);
  }
  return [
    {
      id: uid(),
      kind: 'location',
      name: 'Current location',
      meta: `${lat.toFixed(5)}, ${lng.toFixed(5)} · ±${Math.round(acc)} m`,
    },
  ];
}

interface ContactsManager {
  select(props: string[], opts?: { multiple?: boolean }): Promise<{ name?: string[]; tel?: string[] }[]>;
}

/** system contact picker where the browser supports it; null = show Akaya's own list */
export async function pickSystemContact(): Promise<Attachment[] | null> {
  const nav = navigator as Navigator & { contacts?: ContactsManager };
  if (!nav.contacts?.select) return null;
  const [c] = await nav.contacts.select(['name', 'tel'], { multiple: false });
  if (!c) return [];
  return [{ id: uid(), kind: 'contact', name: c.name?.[0] ?? 'Contact', meta: c.tel?.[0] }];
}

export const SAMPLE_CONTACTS = [
  { name: 'Priya Sharma', tel: '+91 98200 00001' },
  { name: 'Rahul Verma', tel: '+91 98200 00002' },
  { name: 'Neha Iyer', tel: '+91 98200 00003' },
  { name: 'Delivery partner', tel: '+91 98200 00004' },
];

/** demo "Create image": abstract art drawn from the prompt (no image model in this build) */
export function generateImage(prompt: string): Attachment {
  let h = 2166136261;
  for (const ch of prompt) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507)) >>> 0) / 4294967296;
  const c = document.createElement('canvas');
  c.width = 360;
  c.height = 360;
  const ctx = c.getContext('2d');
  if (ctx) {
    const hue = Math.floor(rnd() * 360);
    const g = ctx.createLinearGradient(0, 0, 360, 360);
    g.addColorStop(0, `hsl(${hue} 85% 62%)`);
    g.addColorStop(1, `hsl(${(hue + 140) % 360} 80% 45%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 360, 360);
    for (let i = 0; i < 9; i++) {
      const x = rnd() * 360;
      const y = rnd() * 360;
      const r = 30 + rnd() * 110;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `hsla(${(hue + rnd() * 120) % 360} 95% ${60 + rnd() * 25}% / 0.85)`);
      rg.addColorStop(1, 'hsla(0 0% 100% / 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return {
    id: uid(),
    kind: 'generated',
    name: `${prompt.slice(0, 28).trim() || 'Akaya image'}.jpg`,
    mime: 'image/jpeg',
    thumb: c.toDataURL('image/jpeg', 0.8),
    meta: 'Sample image (demo)',
  };
}
