// Imported from akaya-voice-flow by scripts/import-voice-flow.mjs. Safe to edit by hand (or from the admin panel later).
import type { PageContent } from '../types';

const agentsPhone: PageContent = {
  "key": "agents-phone",
  "kind": "agent",
  "path": "/agents/phone",
  "bubble": "green",
  "seo": {
    "title": "Phone AI Assistant — Voice & AI Phone Control | Akaya",
    "description": "Akaya Phone Agent brings voice AI to your phone, helping you understand your screen, interact with apps, write messages, and perform everyday actions.",
    "keywords": [
      "phone ai assistant",
      "ai phone control",
      "android ai agent"
    ],
    "path": "/agents/phone",
    "breadcrumbs": [
      {
        "name": "Home",
        "path": "/"
      },
      {
        "name": "Agents",
        "path": "/overview"
      },
      {
        "name": "Phone AI Assistant",
        "path": "/agents/phone"
      }
    ]
  },
  "demo": {
    "agent": "Phone Agent",
    "prompt": "“Akaya, find the message from Rahul, check what he asked, and draft a reply.”",
    "steps": [
      "Open Messages",
      "Find Rahul’s latest message",
      "Understand what he asked",
      "Draft a reply for you to confirm"
    ],
    "result": "Reply drafted — waiting for your OK."
  },
  "hero": {
    "id": "your-phone-now-powered-by-akaya",
    "heading": "Your phone. Now powered by Akaya.",
    "body": [
      "Speak naturally. Akaya understands your screen, controls your phone, works across apps, and gets things done."
    ],
    "bullets": [
      "“Akaya, send a message to M|”"
    ]
  },
  "sections": [
    {
      "id": "an-ai-engine-built-around-your-phone",
      "heading": "An AI engine built around your phone.",
      "body": [
        "Voice, vision and action share one runtime, so Akaya can move from a spoken request to a verified result on the device."
      ],
      "items": [
        {
          "title": "Voice",
          "text": "Natural speech in, intent out."
        },
        {
          "title": "Screen Understanding",
          "text": "Reads the UI you are looking at."
        },
        {
          "title": "Action",
          "text": "Taps, types, opens, verifies."
        },
        {
          "title": "Apps",
          "text": "Works across whatever is open."
        },
        {
          "title": "Communication",
          "text": "Messages, calls, contacts."
        },
        {
          "title": "Device",
          "text": "Camera, photos, settings, more."
        }
      ]
    },
    {
      "id": "akaya-is-always-one-tap-away",
      "heading": "Akaya is always one tap away.",
      "body": [
        "Open any text field, tap the floating Akaya button and speak. Your words become clean, written text directly inside the input you are already using."
      ]
    },
    {
      "id": "two-ai-modes-one-akaya",
      "heading": "Two AI modes. One Akaya.",
      "body": [
        "The conversation continues either way — Akaya switches between on-device and cloud intelligence depending on what the task needs."
      ],
      "items": [
        {
          "title": "Offline"
        },
        {
          "title": "Online"
        }
      ]
    },
    {
      "id": "akaya-can-see-what-you-see",
      "heading": "Akaya can see what you see.",
      "body": [
        "Akaya reads the live screen — buttons, text, images, products, messages, forms and menus — then acts on what is actually there."
      ]
    },
    {
      "id": "just-say-what-you-want-done",
      "heading": "Just say what you want done.",
      "body": [
        "Akaya observes the screen, performs the interaction, checks the result, and only then moves on — tap, swipe, scroll, type, open, verify."
      ]
    },
    {
      "id": "akaya-handles-communication",
      "heading": "Akaya handles communication.",
      "body": [
        "Messages, calls, contacts and notifications — understood in context and handled with your confirmation where it counts."
      ],
      "items": [
        {
          "title": "Messages"
        },
        {
          "title": "Calls"
        },
        {
          "title": "Contacts"
        },
        {
          "title": "Notifications"
        }
      ],
      "bullets": [
        "Draft SMS",
        "Read messages",
        "Reply to messages",
        "Call a contact",
        "Open recent calls",
        "Help manage incoming calls",
        "Find contacts",
        "Use contact information",
        "Read important notifications",
        "Surface relevant notifications"
      ]
    },
    {
      "id": "your-phone-becomes-actionable",
      "heading": "Your phone becomes actionable.",
      "body": [
        "Everyday device functions become things you can simply ask for."
      ],
      "items": [
        {
          "title": "Camera",
          "text": "“Akaya, take a photo.”"
        },
        {
          "title": "Photos",
          "text": "“Akaya, find my latest photo.”"
        },
        {
          "title": "Location"
        },
        {
          "title": "Calendar",
          "text": "“Akaya, remind me about this tomorrow.”"
        },
        {
          "title": "Device info",
          "text": "“Akaya, how's my battery?”"
        },
        {
          "title": "Settings",
          "text": "“Akaya, lower the brightness.”"
        }
      ],
      "bullets": [
        "“Akaya, read my notifications.”",
        "“Akaya, open my photos.”"
      ]
    },
    {
      "id": "akaya-never-acts-blindly",
      "heading": "Akaya never acts blindly.",
      "body": [
        "Every action runs through the same loop — observe the screen, understand the UI, decide, act, check the result, and replan if the phone did something unexpected."
      ],
      "items": [
        {
          "title": "Listen",
          "text": "Capture the spoken request."
        },
        {
          "title": "Understand",
          "text": "Resolve intent and entities."
        },
        {
          "title": "See",
          "text": "Read the current screen."
        },
        {
          "title": "Plan",
          "text": "Choose the safest action path."
        },
        {
          "title": "Act",
          "text": "Tap, type, swipe or open."
        },
        {
          "title": "Verify",
          "text": "Check the screen changed as expected."
        },
        {
          "title": "Done",
          "text": "Report back — or replan."
        }
      ]
    },
    {
      "id": "one-modular-phone-engine",
      "heading": "One modular phone engine.",
      "body": [
        "Each capability is a module on the Phone Agent, so new phone functions can join without changing how Akaya works."
      ],
      "items": [
        {
          "title": "VOICE"
        },
        {
          "title": "FLOATING AI"
        },
        {
          "title": "AI CHAT"
        },
        {
          "title": "SCREEN AI"
        },
        {
          "title": "PHONE CONTROL"
        },
        {
          "title": "COMMUNICATION"
        },
        {
          "title": "DEVICE"
        },
        {
          "title": "AGENTS"
        }
      ],
      "bullets": [
        "Voice commands",
        "Speech-to-text",
        "Natural conversation",
        "Voice typing",
        "Rewrite",
        "Reply",
        "Text generation",
        "Online AI",
        "Offline AI",
        "Conversation memory",
        "Screen understanding",
        "UI recognition",
        "Text understanding",
        "Visual understanding",
        "Tap",
        "Swipe",
        "Scroll",
        "Type",
        "Back",
        "Home",
        "Open apps",
        "Switch apps",
        "SMS",
        "Calls",
        "Contacts",
        "Notifications",
        "Camera",
        "Photos",
        "Location",
        "Calendar",
        "Settings",
        "Device information",
        "Job Search Agent",
        "Shopping Agent",
        "Future Akaya agents"
      ]
    },
    {
      "id": "akaya-acts-with-permission",
      "heading": "Akaya acts with permission.",
      "body": [
        "Routine actions run smoothly. Anything sensitive stops for an explicit confirmation, every single time.",
        "Hi Mom — I'll be home in about 20 minutes. See you soon!"
      ],
      "bullets": [
        "Send this message?"
      ]
    },
    {
      "id": "one-request-many-steps-verified",
      "heading": "One request. Many steps. Verified.",
      "body": [
        "“Akaya, find the message from Rahul, check what he asked, and draft a reply.” Voice, screen understanding, reading, reasoning and a confirmation gate — end to end."
      ]
    },
    {
      "id": "give-your-phone-an-ai-that-can-actually-act",
      "heading": "Give your phone an AI that can actually act."
    }
  ]
};

export default agentsPhone;
