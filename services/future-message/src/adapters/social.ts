/** Social publishing adapters: Instagram, Facebook Page, X, LinkedIn, YouTube, TikTok, Threads, Pinterest. */
import type { ScheduledMessage, SendOutcome } from '../types.js';
import type { SendContext, SenderAdapter } from './types.js';
import { callJson, httpFailure, missing } from './http.js';

const GRAPH = 'https://graph.facebook.com/v21.0';

async function waitForContainer(base: string, id: string, token: string, ctx: SendContext, tries = 20): Promise<SendOutcome | null> {
  for (let i = 0; i < tries; i++) {
    const r = await callJson<{ status_code?: string }>(ctx.fetch, `${base}/${id}?fields=status_code&access_token=${encodeURIComponent(token)}`, { method: 'GET' });
    if (!r.ok) return httpFailure(r, 'container status');
    if (r.data.status_code === 'FINISHED') return null;
    if (r.data.status_code === 'ERROR' || r.data.status_code === 'EXPIRED')
      return { ok: false, retryable: false, error: `media processing ${r.data.status_code}` };
    await ctx.sleep(5000);
  }
  return { ok: false, retryable: true, error: 'media still processing' };
}

/**
 * Instagram Content Publishing API (Business/Creator accounts): create a media container from a
 * public URL, wait for video processing, then media_publish.
 */
export const instagram: SenderAdapter = {
  channel: 'instagram',
  requires: ['META_PAGE_ACCESS_TOKEN', 'META_IG_USER_ID'],
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    if (!msg.media) return { ok: false, retryable: false, error: 'Instagram needs an image or video' };
    const token = ctx.creds.META_PAGE_ACCESS_TOKEN;
    const ig = ctx.creds.META_IG_USER_ID;
    const body =
      msg.media.kind === 'video'
        ? { media_type: 'REELS', video_url: msg.media.url, caption: msg.text }
        : { image_url: msg.media.url, caption: msg.text };
    const c = await callJson<{ id?: string }>(ctx.fetch, `${GRAPH}/${ig}/media`, { token, body });
    if (!c.ok || !c.data.id) return httpFailure(c, 'Instagram container');
    if (msg.media.kind === 'video') {
      const wait = await waitForContainer(GRAPH, c.data.id, token, ctx);
      if (wait) return wait;
    }
    const p = await callJson<{ id?: string }>(ctx.fetch, `${GRAPH}/${ig}/media_publish`, { token, body: { creation_id: c.data.id } });
    return p.ok ? { ok: true, externalId: p.data.id } : httpFailure(p, 'Instagram publish');
  },
};

/** Facebook Page posts: /feed for text, /photos for images, /videos for video (file_url). */
export const facebook: SenderAdapter = {
  channel: 'facebook',
  requires: ['META_PAGE_ACCESS_TOKEN', 'META_PAGE_ID'],
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    const page = ctx.creds.META_PAGE_ID;
    const [path, body] = !msg.media
      ? ['feed', { message: msg.text }]
      : msg.media.kind === 'video'
        ? ['videos', { file_url: msg.media.url, description: msg.text }]
        : ['photos', { url: msg.media.url, caption: msg.text }];
    const r = await callJson<{ id?: string; post_id?: string }>(ctx.fetch, `${GRAPH}/${page}/${path}`, { token: ctx.creds.META_PAGE_ACCESS_TOKEN, body });
    return r.ok ? { ok: true, externalId: r.data.post_id ?? r.data.id } : httpFailure(r, 'Facebook');
  },
};

async function bytesOf(url: string, ctx: SendContext): Promise<{ buf: ArrayBuffer; type: string } | SendOutcome> {
  const res = await ctx.fetch(url, { method: 'GET' });
  if (!res.ok) return { ok: false, retryable: res.status >= 500, error: `media download HTTP ${res.status}` };
  return { buf: await res.arrayBuffer(), type: res.headers.get('content-type') ?? 'application/octet-stream' };
}
const isOutcome = (x: unknown): x is SendOutcome => typeof x === 'object' && x !== null && 'ok' in x;

/** X API v2: POST /2/tweets; images go through POST /2/media/upload first. Video upload is not implemented here. */
export const x: SenderAdapter = {
  channel: 'x',
  requires: ['X_ACCESS_TOKEN'],
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    const token = ctx.creds.X_ACCESS_TOKEN;
    let media: { media_ids: string[] } | undefined;
    if (msg.media) {
      if (msg.media.kind === 'video') return { ok: false, retryable: false, error: 'X video upload (chunked) is not implemented in this adapter' };
      const file = await bytesOf(msg.media.url, ctx);
      if (isOutcome(file)) return file;
      const form = new FormData();
      form.append('media', new Blob([file.buf], { type: file.type }));
      form.append('media_category', 'tweet_image');
      const up = await ctx.fetch('https://api.x.com/2/media/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      const upData = (await up.json().catch(() => ({}))) as { data?: { id?: string } };
      if (!up.ok || !upData.data?.id) return { ok: false, retryable: up.status >= 500 || up.status === 429, error: `X media upload HTTP ${up.status}` };
      media = { media_ids: [upData.data.id] };
    }
    const r = await callJson<{ data?: { id: string } }>(ctx.fetch, 'https://api.x.com/2/tweets', {
      token,
      body: { text: msg.text.slice(0, 280), ...(media ? { media } : {}) },
    });
    return r.ok ? { ok: true, externalId: r.data.data?.id } : httpFailure(r, 'X');
  },
};

const LI_HEADERS = { 'LinkedIn-Version': '202509', 'X-Restli-Protocol-Version': '2.0.0' };

/** LinkedIn Posts API (/rest/posts). Images: Images API initializeUpload → PUT bytes → post with media id. */
export const linkedin: SenderAdapter = {
  channel: 'linkedin',
  requires: ['LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_AUTHOR_URN'],
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    const token = ctx.creds.LINKEDIN_ACCESS_TOKEN;
    const author = ctx.creds.LINKEDIN_AUTHOR_URN;
    let content: Record<string, unknown> | undefined;
    if (msg.media?.kind === 'image') {
      const init = await callJson<{ value?: { uploadUrl: string; image: string } }>(ctx.fetch, 'https://api.linkedin.com/rest/images?action=initializeUpload', {
        token,
        headers: LI_HEADERS,
        body: { initializeUploadRequest: { owner: author } },
      });
      if (!init.ok || !init.data.value) return httpFailure(init, 'LinkedIn image init');
      const file = await bytesOf(msg.media.url, ctx);
      if (isOutcome(file)) return file;
      const put = await ctx.fetch(init.data.value.uploadUrl, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: file.buf });
      if (!put.ok) return { ok: false, retryable: put.status >= 500, error: `LinkedIn image upload HTTP ${put.status}` };
      content = { media: { id: init.data.value.image } };
    } else if (msg.media?.kind === 'video') {
      return { ok: false, retryable: false, error: 'LinkedIn video upload (Videos API multipart) is not implemented in this adapter' };
    }
    const r = await callJson(ctx.fetch, 'https://api.linkedin.com/rest/posts', {
      token,
      headers: LI_HEADERS,
      body: {
        author,
        commentary: msg.text.slice(0, 3000),
        visibility: 'PUBLIC',
        distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
        ...(content ? { content } : {}),
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      },
    });
    return r.ok ? { ok: true, externalId: r.headers.get('x-restli-id') ?? undefined } : httpFailure(r, 'LinkedIn');
  },
};

/** YouTube Data API resumable upload. First line of the text is the title (max 100 chars). */
export const youtube: SenderAdapter = {
  channel: 'youtube',
  requires: ['YOUTUBE_ACCESS_TOKEN'],
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    if (msg.media?.kind !== 'video') return { ok: false, retryable: false, error: 'YouTube needs a video' };
    const token = ctx.creds.YOUTUBE_ACCESS_TOKEN;
    const [first, ...rest] = msg.text.split('\n');
    const init = await callJson(ctx.fetch, 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      token,
      headers: { 'X-Upload-Content-Type': msg.media.mime ?? 'video/*' },
      body: {
        snippet: { title: (first || 'Untitled').slice(0, 100), description: rest.join('\n').slice(0, 5000), categoryId: '22' },
        status: { privacyStatus: ctx.creds.YOUTUBE_PRIVACY || 'public', selfDeclaredMadeForKids: false },
      },
    });
    const session = init.headers.get('location');
    if (!init.ok || !session) return httpFailure(init, 'YouTube init');
    const file = await bytesOf(msg.media.url, ctx);
    if (isOutcome(file)) return file;
    const up = await ctx.fetch(session, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': file.type }, body: file.buf });
    const data = (await up.json().catch(() => ({}))) as { id?: string };
    return up.ok ? { ok: true, externalId: data.id } : { ok: false, retryable: up.status >= 500, error: `YouTube upload HTTP ${up.status}` };
  },
};

/** TikTok Content Posting API, direct post from a public URL. Unaudited apps must use SELF_ONLY. */
export const tiktok: SenderAdapter = {
  channel: 'tiktok',
  requires: ['TIKTOK_ACCESS_TOKEN'],
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    if (msg.media?.kind !== 'video') return { ok: false, retryable: false, error: 'TikTok needs a video' };
    const r = await callJson<{ data?: { publish_id?: string }; error?: { code: string; message: string } }>(
      ctx.fetch,
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      {
        token: ctx.creds.TIKTOK_ACCESS_TOKEN,
        body: {
          post_info: { title: msg.text.slice(0, 2200), privacy_level: ctx.creds.TIKTOK_PRIVACY || 'SELF_ONLY', disable_comment: false },
          source_info: { source: 'PULL_FROM_URL', video_url: msg.media.url },
        },
      },
    );
    if (r.ok && r.data.error?.code && r.data.error.code !== 'ok') return { ok: false, retryable: false, error: `TikTok: ${r.data.error.message}` };
    return r.ok ? { ok: true, externalId: r.data.data?.publish_id } : httpFailure(r, 'TikTok');
  },
};

/** Threads API: create container (TEXT / IMAGE / VIDEO), then threads_publish. */
export const threads: SenderAdapter = {
  channel: 'threads',
  requires: ['THREADS_ACCESS_TOKEN', 'THREADS_USER_ID'],
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    const base = 'https://graph.threads.net/v1.0';
    const token = ctx.creds.THREADS_ACCESS_TOKEN;
    const user = ctx.creds.THREADS_USER_ID;
    const body = !msg.media
      ? { media_type: 'TEXT', text: msg.text.slice(0, 500) }
      : msg.media.kind === 'video'
        ? { media_type: 'VIDEO', video_url: msg.media.url, text: msg.text.slice(0, 500) }
        : { media_type: 'IMAGE', image_url: msg.media.url, text: msg.text.slice(0, 500) };
    const c = await callJson<{ id?: string }>(ctx.fetch, `${base}/${user}/threads`, { token, body });
    if (!c.ok || !c.data.id) return httpFailure(c, 'Threads container');
    if (msg.media?.kind === 'video') {
      const wait = await waitForContainer(base, c.data.id, token, ctx);
      if (wait) return wait;
    }
    const p = await callJson<{ id?: string }>(ctx.fetch, `${base}/${user}/threads_publish`, { token, body: { creation_id: c.data.id } });
    return p.ok ? { ok: true, externalId: p.data.id } : httpFailure(p, 'Threads publish');
  },
};

/** Pinterest API v5: create a Pin on a board from an image URL. */
export const pinterest: SenderAdapter = {
  channel: 'pinterest',
  requires: ['PINTEREST_ACCESS_TOKEN', 'PINTEREST_BOARD_ID'],
  async send(msg: ScheduledMessage, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    if (msg.media?.kind !== 'image') return { ok: false, retryable: false, error: 'This Pinterest adapter supports image Pins' };
    const r = await callJson<{ id?: string }>(ctx.fetch, 'https://api.pinterest.com/v5/pins', {
      token: ctx.creds.PINTEREST_ACCESS_TOKEN,
      body: {
        board_id: ctx.creds.PINTEREST_BOARD_ID,
        description: msg.text.slice(0, 500),
        media_source: { source_type: 'image_url', url: msg.media.url },
      },
    });
    return r.ok ? { ok: true, externalId: r.data.id } : httpFailure(r, 'Pinterest');
  },
};
