// Imported from akaya-voice-flow by scripts/import-voice-flow.mjs. Safe to edit by hand (or from the admin panel later).
import type { PageContent } from '../types';

const app: PageContent = {
  "key": "app",
  "kind": "generic",
  "path": "/app",
  "bubble": "cream",
  "seo": {
    "title": "Akaya Assistant — talk to your AI",
    "description": "Open the Akaya voice assistant: speak a command, get a spoken answer. Works online with AI and offline with on-device commands.",
    "keywords": [
      "talk to ai",
      "voice ai chat online",
      "ai web reader"
    ],
    "path": "/app",
    "breadcrumbs": [
      {
        "name": "Home",
        "path": "/"
      },
      {
        "name": "Akaya Assistant",
        "path": "/app"
      }
    ]
  },
  "hero": {
    "id": "say-it-akaya-does-it",
    "heading": "Say it. Akaya does it.",
    "body": [
      "Tap the mic and try “set a timer for 2 minutes”, “remind me to call Priya”, or ask anything at all."
    ]
  },
  "sections": [
    {
      "id": "web-reader",
      "heading": "Web Reader",
      "body": [
        "Give Akaya a public website and ask about it.",
        "Public web pages only. Akaya respects robots.txt and site terms, and does not read private, logged-in or password-protected pages."
      ]
    },
    {
      "id": "reminders",
      "heading": "Reminders",
      "body": [
        "Saved on this device, available offline."
      ]
    },
    {
      "id": "notes",
      "heading": "Notes"
    }
  ]
};

export default app;
