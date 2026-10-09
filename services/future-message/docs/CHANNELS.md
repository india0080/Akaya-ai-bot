# Channel matrix

`auto`: **api** = sends automatically with the user's OAuth token · **business** = automatic, but needs a business /
Page / server account · **tap** = no official API; a reminder push opens the app pre-filled and the user taps Send.

| Channel | auto | API used | Media | Limits / requirements |
|---|---|---|---|---|
| WhatsApp (personal) | tap | none (`wa.me` deep link) | – | No API for personal accounts exists. |
| WhatsApp Business | business | Cloud API `/{phone-id}/messages` | image, video | Template required outside the 24 h window; Meta business verification; template approval. |
| Telegram | api | Bot API `sendMessage/sendPhoto/sendVideo` | image, video | The bot can only message users or groups that started it. Not the user's personal account. |
| Gmail | api | `users.messages.send` (raw RFC 2822) | (links) | `gmail.send` is a sensitive scope that needs Google OAuth verification. |
| Outlook | api | Graph `POST /me/sendMail` | (links) | `Mail.Send` delegated. |
| Slack | api | `chat.scheduleMessage` (native), `chat.postMessage` | – | Bot must be in the channel. Native schedules up to 120 days ahead. |
| Microsoft Teams | api | Graph `chats/{id}/messages` | – | `ChatMessage.Send`. |
| Messenger | business | Send API | – | Pages only; messaging window and tags apply. |
| Instagram DM | business | Graph `/{ig-id}/messages` | – | Professional account; 24 h window. |
| Signal | tap | none (`sgnl://`) | – | No official API. |
| SMS | tap | none (`sms:` link) | – | A carrier gateway (e.g. Twilio) could make this automatic, but from a business number. |
| Discord | business | Webhook | – | Server channels, not personal DMs. |
| Instagram | business | Graph `media` → `media_publish` | image, Reel | Professional account; media must be a public URL; 100 posts / 24 h. |
| Facebook Page | business | Graph `/{page}/feed`, `/photos`, `/videos` | image, video | Pages only. |
| X | api | v2 `POST /2/tweets`, v1.1 media upload | image | Paid tier; video upload not implemented. |
| LinkedIn | api | `/rest/posts`, Images API | image | `w_member_social`; Pages need Community Management API; video not implemented. |
| YouTube / Shorts | api | Data API resumable upload | video (required) | Upload quota (~1,600 units per upload); unverified projects upload as private. |
| TikTok | api | Content Posting API (`PULL_FROM_URL`) | video (required) | Unaudited apps post `SELF_ONLY`; the URL domain must be verified. |
| Threads | api | Threads API container → publish | image, video | 250 posts / 24 h. |
| Pinterest | api | API v5 `POST /pins` | image or video (required) | Needs a board id. |

All adapters treat HTTP 429 / 5xx / network errors as **retryable** (backoff 1 m → 5 m → 15 m, 3 attempts) and 4xx
as **permanent** (shown as Failed with the API's message; the user can fix the problem and press Retry).
