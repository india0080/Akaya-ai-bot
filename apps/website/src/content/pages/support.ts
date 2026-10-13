// Imported from akaya-voice-flow by scripts/import-voice-flow.mjs. Safe to edit by hand (or from the admin panel later).
import type { PageContent } from '../types';

const support: PageContent = {
  "key": "support",
  "kind": "generic",
  "path": "/support",
  "bubble": "orange",
  "seo": {
    "title": "Akaya Support — Help Center & Troubleshooting",
    "description": "Get help with Akaya, including voice, Floating AI, Phone Agent, AI Agents, account settings, troubleshooting, and common questions.",
    "keywords": [
      "akaya support",
      "ai assistant troubleshooting",
      "help center"
    ],
    "path": "/support",
    "breadcrumbs": [
      {
        "name": "Home",
        "path": "/"
      },
      {
        "name": "Akaya Support",
        "path": "/support"
      }
    ]
  },
  "hero": {
    "id": "how-can-we-help",
    "heading": "How can we help?",
    "body": [
      "Find setup help, troubleshooting steps, and answers about Akaya voice, Floating AI, agents, account settings, and privacy."
    ]
  },
  "sections": [
    {
      "id": "voice-and-microphone",
      "heading": "Voice and microphone",
      "body": [
        "If Akaya cannot hear you, check microphone permission for your browser or device, then retry. Akaya falls back to typed input when the microphone is unavailable."
      ]
    },
    {
      "id": "floating-ai",
      "heading": "Floating AI",
      "body": [
        "Floating AI runs above your other apps on Android. Enable the display-over-apps permission, then tap the Akaya button to speak or type without leaving the app you are in."
      ]
    },
    {
      "id": "phone-agent",
      "heading": "Phone Agent",
      "body": [
        "The Phone Agent needs accessibility access to read the screen and perform taps. Sensitive actions always ask for confirmation before they run."
      ]
    },
    {
      "id": "online-and-offline-modes",
      "heading": "Online and offline modes",
      "body": [
        "Offline mode handles time, timers, reminders, notes, conversions and maths on the device. Online mode adds full understanding, spoken replies and agent workflows."
      ]
    },
    {
      "id": "account-and-plans",
      "heading": "Account and plans",
      "body": [
        "Sign in or create an account from the Try Akaya page. Your preferences follow your account across every device where you sign in."
      ]
    },
    {
      "id": "privacy-and-data",
      "heading": "Privacy and data",
      "body": [
        "Offline requests stay on the device. Online requests are used to answer you, and Akaya asks before any action that sends or changes information."
      ]
    },
    {
      "id": "jump-to-the-right-product-page",
      "heading": "Jump to the right product page.",
      "bullets": [
        "Phone Agent — voice and screen control on your phone",
        "Job Search Agent — matching, ranking and salary insight",
        "Shopping Agent — product comparison and recommendations",
        "Finance Agent — spending, budgets and goals",
        "Akaya FAQ — common questions answered",
        "About Akaya — vision, privacy and platforms"
      ]
    }
  ]
};

export default support;
