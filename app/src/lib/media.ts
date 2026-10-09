/** Small browser-side media helpers: thumbnails for previews (kept small so they fit in localStorage). */

export function humanSize(bytes?: number): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function drawThumb(src: CanvasImageSource, w: number, h: number, max: number, filter?: string): string {
  const k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * k));
  c.height = Math.max(1, Math.round(h * k));
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  if (filter) ctx.filter = filter;
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.72);
}

/** JPEG thumbnail (max side `max` px) from an image URL or data URL */
export function imageThumb(url: string, max = 360, filter?: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(drawThumb(img, img.naturalWidth, img.naturalHeight, max, filter));
    img.onerror = () => resolve('');
    img.src = url;
  });
}

/** first-frame thumbnail of a video file */
export function videoThumb(url: string, max = 360): Promise<string> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    const done = (s: string) => {
      v.removeAttribute('src');
      v.load();
      resolve(s);
    };
    v.onloadeddata = () => {
      v.currentTime = Math.min(0.5, (v.duration || 1) / 3);
    };
    v.onseeked = () => done(drawThumb(v, v.videoWidth, v.videoHeight, max));
    v.onerror = () => done('');
    window.setTimeout(() => done(''), 5000);
    v.src = url;
  });
}

/** preview for any picked file: images/videos get a thumbnail, others none */
export async function fileThumb(file: File, max = 360, filter?: string): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    if (file.type.startsWith('image/')) return await imageThumb(url, max, filter);
    if (file.type.startsWith('video/')) return await videoThumb(url, max);
    return '';
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 8000);
  }
}

/** open the system file picker (works in the Android WebView too) */
export function pickFiles(accept: string, multiple = true, capture?: 'environment' | 'user'): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    if (capture) input.setAttribute('capture', capture);
    input.style.display = 'none';
    input.onchange = () => {
      resolve(Array.from(input.files ?? []));
      input.remove();
    };
    input.oncancel = () => {
      resolve([]);
      input.remove();
    };
    document.body.appendChild(input);
    input.click();
  });
}

/** extension label for document chips */
export function extOf(name: string): string {
  const m = /\.([a-z0-9]{1,5})$/i.exec(name);
  return m ? m[1].toUpperCase() : 'FILE';
}
