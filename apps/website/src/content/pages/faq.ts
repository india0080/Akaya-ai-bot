// Imported from akaya-voice-flow by scripts/import-voice-flow.mjs. Safe to edit by hand (or from the admin panel later).
import type { PageContent } from '../types';

const faq: PageContent = {
  "key": "faq",
  "kind": "faq",
  "path": "/faq",
  "bubble": "green",
  "seo": {
    "title": "FAQ — Akaya Voice Assistant",
    "description": "Answers about how Akaya works offline and online, supported platforms, agents, privacy, pricing and account questions.",
    "keywords": [
      "akaya faq",
      "offline ai questions",
      "ai assistant help"
    ],
    "path": "/faq",
    "breadcrumbs": [
      {
        "name": "Home",
        "path": "/"
      },
      {
        "name": "FAQ",
        "path": "/faq"
      }
    ]
  },
  "hero": {
    "id": "questions-about-akaya-answered",
    "heading": "Questions about Akaya, answered.",
    "body": [
      "How Akaya listens, what it can do offline, which agents are available, and how your data is handled."
    ]
  },
  "sections": [
    {
      "id": "getting-started",
      "heading": "GETTING STARTED",
      "faqs": [
        {
          "q": "What is Akaya?",
          "a": "Akaya is a voice-first AI assistant that turns what you say into real action across your apps and devices. You speak, Akaya understands the intent and the screen, and then performs the task."
        },
        {
          "q": "How do I start using Akaya?",
          "a": "Open the Try Akaya page, create an account with email or Google, then launch the assistant. You can start talking immediately — no setup or configuration required."
        },
        {
          "q": "Do I need a microphone permission?",
          "a": "Yes. Akaya needs microphone access to listen for your requests. You can revoke the permission any time in your browser or device settings, and Akaya will fall back to typed input."
        }
      ]
    },
    {
      "id": "offline-online",
      "heading": "OFFLINE & ONLINE",
      "faqs": [
        {
          "q": "What works offline?",
          "a": "On-device commands work without a connection: time and date, timers, reminders, quick notes, unit conversions and maths. Nothing leaves your device in offline mode."
        },
        {
          "q": "What does online mode add?",
          "a": "Online mode adds full natural-language understanding, spoken replies, longer reasoning, drafting and the agent workflows such as Phone, Job Search and Shopping."
        },
        {
          "q": "Does Akaya switch modes automatically?",
          "a": "Yes. Akaya detects connectivity and uses the on-device engine when you are offline, then upgrades to the online engine as soon as a connection is available."
        }
      ]
    },
    {
      "id": "agents",
      "heading": "AGENTS",
      "faqs": [
        {
          "q": "What is the Phone Agent?",
          "a": "The Phone Agent understands your voice and your screen. It can draft and send messages, control apps with taps and swipes, place calls and run device actions such as camera and photos."
        },
        {
          "q": "What does the Job Search Agent do?",
          "a": "It captures your preferences, searches US job boards, filters and ranks roles, compares base salary, bonus, equity and total compensation, then helps you apply and follow up by email."
        },
        {
          "q": "What does the Shopping Agent do?",
          "a": "It searches retailer sources, normalises listings, compares price, rating and delivery, then recommends the best match. Prices are shown in USD and demo listings are clearly labelled."
        }
      ]
    },
    {
      "id": "platforms",
      "heading": "PLATFORMS",
      "faqs": [
        {
          "q": "Which platforms are supported?",
          "a": "Android and iOS are available today. Windows and Mac are coming soon."
        },
        {
          "q": "Can I use Akaya on more than one device?",
          "a": "Yes. Your account carries your preferences across every device where you sign in."
        }
      ]
    },
    {
      "id": "privacy-security",
      "heading": "PRIVACY & SECURITY",
      "faqs": [
        {
          "q": "Is my voice recorded?",
          "a": "Offline commands are processed entirely on your device. In online mode a request is sent for understanding and a reply, and we do not sell your data or use it to build advertising profiles."
        },
        {
          "q": "How are sensitive actions handled?",
          "a": "Actions such as sending a message, placing a call or completing a purchase pass through a confirmation gate. Akaya shows exactly what it is about to do and waits for your approval."
        },
        {
          "q": "Can I delete my data?",
          "a": "Yes. You can delete your account and its associated data at any time from your account settings."
        }
      ]
    },
    {
      "id": "plans-billing",
      "heading": "PLANS & BILLING",
      "faqs": [
        {
          "q": "Is there a free plan?",
          "a": "Yes. The free plan includes offline commands and a monthly allowance of online requests, which is enough for everyday use."
        },
        {
          "q": "What do paid plans include?",
          "a": "Paid plans raise the online request limits, unlock the full agent workflows and add priority response speed."
        },
        {
          "q": "Can I cancel any time?",
          "a": "Yes. Plans are month to month and you keep access until the end of the period you already paid for."
        }
      ]
    },
    {
      "id": "still-have-a-question",
      "heading": "Still have a question?",
      "body": [
        "Try Akaya yourself — it usually answers faster than we can."
      ]
    }
  ]
};

export default faq;
