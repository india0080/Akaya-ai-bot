// Imported from akaya-voice-flow by scripts/import-voice-flow.mjs. Safe to edit by hand (or from the admin panel later).
import type { PageContent } from '../types';

const overview: PageContent = {
  "key": "overview",
  "kind": "generic",
  "path": "/overview",
  "bubble": "blue",
  "seo": {
    "title": "Akaya Overview — Voice-First AI Assistant & AI Agents",
    "description": "Explore Akaya, a voice-first personal AI assistant with Floating AI, online and offline AI, Phone Agent, Job Search, Shopping, Finance, and more.",
    "keywords": [
      "akaya overview",
      "voice-first ai assistant",
      "ai agents",
      "ai image generation",
      "web reader ai"
    ],
    "path": "/overview",
    "breadcrumbs": [
      {
        "name": "Home",
        "path": "/"
      },
      {
        "name": "Akaya Overview",
        "path": "/overview"
      }
    ]
  },
  "hero": {
    "id": "meet-the-ai-that-works-across-your-world",
    "heading": "Meet the AI that works across your world.",
    "body": [
      "Akaya is a voice-first personal AI assistant that understands what you want, works across your phone and apps, and helps turn conversations into actions."
    ]
  },
  "sections": [
    {
      "id": "akaya-is-more-than-a-chatbot",
      "heading": "Akaya is more than a chatbot.",
      "body": [
        "Akaya is designed to move beyond conversation. It can understand voice, interact with supported phone experiences, use specialized agents, and help complete real-world tasks.",
        "The conversation ends with a reply.",
        "The conversation becomes an action."
      ]
    },
    {
      "id": "one-ai-layer-everywhere-you-work",
      "heading": "One AI layer. Everywhere you work.",
      "body": [
        "Akaya sits between your voice and the things you already use, so one request can travel from what you say to what actually happens.",
        "App support varies by platform and permission."
      ]
    },
    {
      "id": "everything-starts-with-one-voice",
      "heading": "Everything starts with one voice.",
      "body": [
        "Read and explain images and screenshots.",
        "Summarize long text, documents and content.",
        "Translate text and voice between languages.",
        "Generate context-aware replies.",
        "Run supported phone actions with your voice.",
        "Understand what is on screen before acting."
      ],
      "items": [
        {
          "title": "Floating AI",
          "text": "Bring Akaya into supported text fields and write, rewrite, and respond using your voice."
        },
        {
          "title": "Chat",
          "text": "Have a natural conversation with Akaya through text or voice."
        },
        {
          "title": "Voice Assistant",
          "text": "Speak naturally and ask Akaya to help with everyday tasks."
        },
        {
          "title": "Agents",
          "text": "Give Akaya a specific job to handle, from finding jobs to comparing products."
        },
        {
          "title": "Audio to Text",
          "text": "Turn speech and audio into accurate text."
        },
        {
          "title": "Image Generation",
          "text": "Create images from simple text or voice prompts with Akaya."
        },
        {
          "title": "Web Reader",
          "text": "Give Akaya a website. It reads, understands, and helps you use the information."
        }
      ]
    },
    {
      "id": "say-it-akaya-draws-it",
      "heading": "Say it. Akaya draws it.",
      "body": [
        "Create images from simple text or voice prompts — inside chat, on your phone, or hands-free.",
        "Akaya, create a modern product poster for my AI assistant.",
        "Generate, regenerate, download and share are shown here; editing and variations arrive as they ship.",
        "“Create a colorful futuristic image of a voice assistant floating above a smartphone.”"
      ],
      "bullets": [
        "1 Prompt",
        "2 Understanding",
        "3 Generating",
        "4 Refining",
        "5 Image ready",
        "1 Listening",
        "2 Understanding prompt",
        "3 Generating image",
        "4 Image ready"
      ]
    },
    {
      "id": "give-akaya-a-website",
      "heading": "Give Akaya a website.",
      "body": [
        "Akaya reads public web pages, understands them, and helps you use the information — by voice or in chat.",
        "Akaya, read this website and tell me the important points.",
        "Ask follow-up questions about the same page without reading it again.",
        "“Akaya, open this website and explain what this page is about.”",
        "Best option: Page A is the better match for a lighter everyday laptop at a lower price.",
        "Example values shown. Real comparisons depend on what each public page publishes.",
        "Reads supported product pages.",
        "Reads supported job listings.",
        "Reads public financial information.",
        "Reads several public sources together.",
        "Where an official API or integration exists, Akaya prefers it; web reading covers public pages.",
        "Only process websites and content you are authorized to access. If a page cannot be read, Akaya says so — “Akaya couldn't read this page.” — and offers to try again."
      ],
      "items": [
        {
          "title": "What Akaya can do with a page"
        },
        {
          "title": "Compare two websites",
          "text": "“Compare these two laptops from these websites.” Akaya reads both public pages and lines them up."
        },
        {
          "title": "Built for Akaya Agents"
        },
        {
          "title": "Model-flexible and secure",
          "text": "Web Reader is not tied to one AI model. Fetching and extraction happen on Akaya's servers, then a configurable provider processes the page."
        }
      ],
      "bullets": [
        "1 URL",
        "2 Fetch page",
        "3 Extract content",
        "4 Understand",
        "5 Answer",
        "2 Reading website",
        "3 Understanding",
        "4 Answering",
        "Akaya reads only the public content of the page.",
        "The main topic and key sections are identified.",
        "Prices, dates and contact details are pulled out when present.",
        "You can keep asking questions about the same page.",
        "Answers stay grounded in what the page actually says.",
        "Only providers that are actually configured are offered.",
        "API keys stay on the server and are never sent to the browser.",
        "Public pages only — no private, logged-in or password-protected content.",
        "robots.txt, site terms and rate limits are respected.",
        "Large pages are handled section by section instead of silently cut."
      ]
    },
    {
      "id": "built-around-your-phone",
      "heading": "Built around your phone.",
      "body": [
        "Voice input, screen understanding, a supported phone action, and a result you can see.",
        "Akaya, open my messages and find the latest message from Sarah.",
        "Are we still on for tomorrow at 4?",
        "Akaya stays reachable above the app you are using.",
        "Speak naturally; Akaya handles the sequence."
      ],
      "items": [
        {
          "title": "Screen Understanding",
          "text": "Akaya reads what is on screen to know where it is."
        },
        {
          "title": "Phone Control",
          "text": "Supported actions are performed step by step."
        }
      ],
      "bullets": [
        "3 Opening Messages",
        "4 Finding Sarah",
        "5 Showing result"
      ]
    },
    {
      "id": "one-assistant-two-ways-to-think",
      "heading": "One assistant. Two ways to think.",
      "body": [
        "Some capabilities run on your device where supported; the most advanced work happens online.",
        "Not every capability works offline — availability depends on your device and the action."
      ],
      "items": [
        {
          "title": "On-device intelligence"
        },
        {
          "title": "Cloud intelligence"
        }
      ],
      "bullets": [
        "Works without internet where supported",
        "Private local processing",
        "Fast local assistance",
        "Local voice commands",
        "Supported phone actions",
        "Advanced AI models",
        "Web search",
        "Live information",
        "Deep reasoning",
        "Advanced agents",
        "Complex tasks"
      ]
    },
    {
      "id": "always-within-reach",
      "heading": "Always within reach.",
      "body": [
        "Akaya floats above supported apps, so your voice can write wherever you type.",
        "Make this message more professional.",
        "Hi, would you be available to connect tomorrow?"
      ],
      "bullets": [
        "1 Open Akaya",
        "2 Enable Floating AI",
        "3 Allow the required permission",
        "4 Akaya appears as a floating button",
        "5 Open a text field and tap Akaya",
        "6 Speak — your text appears"
      ]
    },
    {
      "id": "give-akaya-a-job",
      "heading": "Give Akaya a job.",
      "items": [
        {
          "title": "Phone Agent",
          "text": "Understand your phone and help perform supported actions."
        },
        {
          "title": "Job Search Agent",
          "text": "Search, filter, match, rank, and help with job opportunities."
        },
        {
          "title": "Shopping Agent",
          "text": "Search supported shopping sources, compare products, and recommend the best match."
        },
        {
          "title": "Grocery Agent",
          "text": "Plan groceries, discover products, compare options, and simplify everyday shopping with Akaya."
        },
        {
          "title": "Finance Agent",
          "text": "Understand and organize financial information, spending, budgets, and goals."
        }
      ],
      "bullets": [
        "More agents coming."
      ]
    },
    {
      "id": "find-me-a-senior-product-designer-job-in-the-us-",
      "heading": "“Find me a senior product designer job in the US above $120K.”",
      "body": [
        "Find me a senior product designer job in the US with a salary above $120K.",
        "Example data. Akaya helps you prepare and track applications; it does not submit applications on your behalf without a supported integration."
      ],
      "bullets": [
        "1 Search",
        "2 Filter",
        "3 AI Match",
        "4 Rank"
      ]
    },
    {
      "id": "find-a-school-bag-for-my-3-year-old-daughter-und",
      "heading": "“Find a school bag for my 3-year-old daughter under $50.”",
      "body": [
        "Demo data shown for illustration. Live results depend on connected shopping sources."
      ],
      "items": [
        {
          "title": "Kids School Backpack"
        }
      ],
      "bullets": [
        "2 Compare",
        "3 Check ratings",
        "4 Check reviews",
        "5 Match requirements",
        "6 Recommend"
      ]
    },
    {
      "id": "how-much-did-i-spend-this-month",
      "heading": "“How much did I spend this month?”",
      "body": [
        "You spent 8% less than last month.",
        "Akaya helps you see and organize spending in plain language. Example figures shown.",
        "Akaya is not a bank and does not provide regulated financial advice."
      ]
    },
    {
      "id": "say-it-once-akaya-takes-it-from-there",
      "heading": "Say it once. Akaya takes it from there."
    },
    {
      "id": "different-models-one-akaya",
      "heading": "Different models. One Akaya.",
      "body": [
        "Akaya can be designed around multiple AI models and specialized engines rather than being locked to a single model."
      ]
    },
    {
      "id": "powerful-ai-you-stay-in-control",
      "heading": "Powerful AI. You stay in control.",
      "body": [
        "Protections depend on your device, permissions, and the action being performed."
      ],
      "items": [
        {
          "title": "Permission-based access",
          "text": "Akaya only uses what you allow."
        },
        {
          "title": "Offline processing where supported",
          "text": "Some tasks can stay on your device."
        },
        {
          "title": "Secure communication",
          "text": "Requests to online models are sent over encrypted connections."
        },
        {
          "title": "User confirmation",
          "text": "Sensitive actions ask before they run."
        },
        {
          "title": "Transparent actions",
          "text": "You can see the steps Akaya takes."
        }
      ],
      "bullets": [
        "Send message?",
        "Make purchase?"
      ]
    },
    {
      "id": "akaya-wherever-you-are",
      "heading": "Akaya, wherever you are.",
      "items": [
        {
          "title": "ANDROID"
        },
        {
          "title": "IOS"
        },
        {
          "title": "WINDOWS"
        },
        {
          "title": "MAC"
        }
      ]
    },
    {
      "id": "built-for-everyday-life",
      "heading": "Built for everyday life.",
      "items": [
        {
          "title": "For People",
          "text": "Everyday communication and personal tasks."
        },
        {
          "title": "For Professionals",
          "text": "Work, research, writing, and productivity."
        },
        {
          "title": "For Job Seekers",
          "text": "Job discovery and application assistance."
        },
        {
          "title": "For Everyday Shoppers",
          "text": "Product research and comparison."
        }
      ]
    },
    {
      "id": "one-continuous-flow",
      "heading": "One continuous flow."
    },
    {
      "id": "akaya-is-just-getting-started",
      "heading": "Akaya is just getting started.",
      "body": [
        "New agents, models, integrations, devices, and capabilities can continue to expand what Akaya can do."
      ]
    },
    {
      "id": "your-voice-your-ai-anywhere",
      "heading": "Your voice. Your AI. Anywhere.",
      "body": [
        "Meet Akaya and experience a more natural way to use AI."
      ]
    }
  ]
};

export default overview;
