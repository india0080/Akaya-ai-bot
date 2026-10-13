// Imported from akaya-voice-flow by scripts/import-voice-flow.mjs. Safe to edit by hand (or from the admin panel later).
import type { PageContent } from '../types';

const agentsGrocery: PageContent = {
  "key": "agents-grocery",
  "kind": "agent",
  "path": "/agents/grocery",
  "bubble": "blue",
  "seo": {
    "title": "Grocery Agent | Akaya",
    "description": "Akaya Grocery Agent helps you build grocery lists, organize shopping, discover better options, and simplify everyday grocery planning with voice.",
    "keywords": [
      "ai grocery assistant",
      "grocery list ai",
      "voice grocery shopping"
    ],
    "path": "/agents/grocery",
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
        "name": "Grocery Agent",
        "path": "/agents/grocery"
      }
    ]
  },
  "demo": {
    "agent": "Grocery Agent",
    "prompt": "“I need groceries for this week.”",
    "steps": [
      "Check your usual list",
      "Add weekly staples",
      "Compare supported stores",
      "Group items by store"
    ],
    "result": "Grocery plan ready for review."
  },
  "hero": {
    "id": "your-groceries-handled-by-akaya",
    "heading": "Your groceries, handled by Akaya.",
    "body": [
      "Tell Akaya what you need. It can build your grocery list, organize it, find better options, and help you stay on top of everyday shopping.",
      "Demo data shown for preview."
    ],
    "bullets": [
      "“I need groceries for this week.”",
      "Bananas · Apples · Spinach"
    ]
  },
  "sections": [
    {
      "id": "from-i-need-groceries-to-a-ready-list",
      "heading": "From “I need groceries” to a ready list.",
      "body": [
        "One continuous workflow across your phone and desktop. All figures shown are demo data.",
        "Demo data. No live retailer pricing is connected."
      ],
      "bullets": [
        "This week’s grocery list · demo data",
        "Bananas",
        "Apples",
        "Tomatoes",
        "Spinach",
        "Milk",
        "Eggs",
        "Yogurt",
        "Whole Wheat Bread",
        "Chicken",
        "Snacks",
        "7 items are usually purchased weekly.",
        "2 items may be running low.",
        "Akaya found a better-value option.",
        "Estimated total: $86.40 (demo)"
      ]
    },
    {
      "id": "more-than-a-grocery-list",
      "heading": "More than a grocery list.",
      "items": [
        {
          "title": "Smart Grocery Lists",
          "text": "Turn natural voice requests into organized grocery lists."
        },
        {
          "title": "Weekly Planning",
          "text": "Create recurring grocery lists based on routines."
        },
        {
          "title": "Smart Categorization",
          "text": "Automatically organize groceries into categories."
        },
        {
          "title": "Product Discovery",
          "text": "Find suitable products based on preferences."
        },
        {
          "title": "Compare Options",
          "text": "Compare price, size, ratings, availability and other relevant information when supported."
        },
        {
          "title": "Budget Awareness",
          "text": "Keep grocery planning within a user-defined budget."
        },
        {
          "title": "Reminders",
          "text": "Remind you about recurring grocery shopping."
        },
        {
          "title": "Voice First",
          "text": "Create, update and manage grocery lists naturally with voice."
        }
      ]
    },
    {
      "id": "voice-in-grocery-plan-out",
      "heading": "Voice in, grocery plan out."
    },
    {
      "id": "akaya-remembers-the-way-you-shop",
      "heading": "Akaya remembers the way you shop.",
      "body": [
        "Recurring grocery routines are a planned capability for the Grocery Agent. The example below is a demo of how a weekly routine could look — no shopping history is stored today."
      ],
      "bullets": [
        "Milk Every 7 days",
        "Eggs Every 7 days",
        "Bread Every 5 days",
        "Fruit Every 4 days"
      ]
    },
    {
      "id": "add-remove-and-move-items-by-voice",
      "heading": "Add, remove and move items by voice.",
      "body": [
        "Speak naturally and the list updates instantly — no typing, no menus. Every change is confirmed back to you.",
        "“Akaya, add bananas and yogurt to my grocery list.”"
      ],
      "bullets": [
        "“Akaya, add bananas and yogurt to my grocery list.”",
        "“Remove yogurt.”",
        "“Move snacks to next week’s list.”"
      ]
    },
    {
      "id": "your-grocery-assistant-your-control",
      "heading": "Your grocery assistant. Your control.",
      "body": [
        "The Grocery Agent is designed around explicit user control. You decide what it can see and what it is allowed to do."
      ],
      "bullets": [
        "Grocery lists stay under your control.",
        "Actions are clear and shown before they happen.",
        "Integrations are permission-aware and opt-in.",
        "No purchase is made without your confirmation.",
        "Connected account data is handled securely when integrations are enabled."
      ]
    },
    {
      "id": "one-grocery-assistant-multiple-possibilities",
      "heading": "One grocery assistant. Multiple possibilities.",
      "body": [
        "Retail integrations coming soon. No grocery retailer API is connected today — the cards below are conceptual examples of what the Grocery Agent could support."
      ],
      "items": [
        {
          "title": "Grocery retailers",
          "text": "Browse and compare grocery products when a retailer integration is available."
        },
        {
          "title": "List apps & notes",
          "text": "Sync a grocery list into the note or list app you already use."
        },
        {
          "title": "Calendar & reminders",
          "text": "Schedule a weekly grocery run and get reminded on time."
        }
      ]
    },
    {
      "id": "your-next-grocery-run-could-be-simpler",
      "heading": "Your next grocery run could be simpler.",
      "body": [
        "Grocery Agent is coming soon to Akaya."
      ]
    }
  ]
};

export default agentsGrocery;
