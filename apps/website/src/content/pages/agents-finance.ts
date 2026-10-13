// Imported from akaya-voice-flow by scripts/import-voice-flow.mjs. Safe to edit by hand (or from the admin panel later).
import type { PageContent } from '../types';

const agentsFinance: PageContent = {
  "key": "agents-finance",
  "kind": "agent",
  "path": "/agents/finance",
  "bubble": "cyan",
  "seo": {
    "title": "AI Finance Assistant — Understand Your Money with Akaya",
    "description": "Akaya Finance Agent helps organize financial information, understand spending, track budgets, monitor recurring expenses, and plan financial goals.",
    "keywords": [
      "ai finance assistant",
      "expense tracker ai",
      "personal finance ai"
    ],
    "path": "/agents/finance",
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
        "name": "AI Finance Assistant",
        "path": "/agents/finance"
      }
    ]
  },
  "demo": {
    "agent": "Finance Agent",
    "prompt": "“How much did I spend on food?”",
    "steps": [
      "Read connected records",
      "Group food transactions",
      "Compare with last month",
      "Summarize the trend"
    ],
    "result": "Food spending summary with categories."
  },
  "hero": {
    "id": "your-money-one-intelligent-view",
    "heading": "Your money. One intelligent view.",
    "body": [
      "Ask Akaya about your spending in plain language. The Finance Agent helps organize financial information, understand where money goes, track budgets, monitor recurring expenses, and plan goals — in USD, for US accounts and everyday budgeting.",
      "Akaya provides organization and insight, not regulated financial, tax, or investment advice.",
      "Illustrative example figures."
    ],
    "bullets": [
      "“How much did I spend on food?”"
    ]
  },
  "sections": [
    {
      "id": "a-personal-finance-ai-you-can-simply-talk-to",
      "heading": "A personal finance AI you can simply talk to.",
      "items": [
        {
          "title": "Organize accounts and balances",
          "text": "Bring balances, cards, and everyday accounts into one place you can ask questions about."
        },
        {
          "title": "Understand your spending",
          "text": "Akaya groups transactions into categories so you can see where money actually goes each month."
        },
        {
          "title": "Track budgets by category",
          "text": "Set a monthly budget for groceries, transport, or dining, and check progress by voice."
        },
        {
          "title": "Monitor recurring expenses",
          "text": "Surface subscriptions and repeating charges so renewals never arrive as a surprise."
        },
        {
          "title": "Ask about any transaction",
          "text": "“What was that $46 charge on Tuesday?” — Akaya finds the record and explains the context."
        },
        {
          "title": "Plan financial goals",
          "text": "Describe a savings goal in USD and Akaya helps break it into a monthly plan you can follow."
        }
      ]
    },
    {
      "id": "from-question-to-plan-in-one-conversation",
      "heading": "From question to plan, in one conversation.",
      "items": [
        {
          "title": "Ask",
          "text": "Speak or type a money question in everyday language."
        },
        {
          "title": "Organize",
          "text": "Akaya groups the relevant records and categories."
        },
        {
          "title": "Explain",
          "text": "You get a clear answer with the numbers behind it."
        },
        {
          "title": "Plan",
          "text": "Turn the answer into a budget, alert, or savings goal."
        }
      ]
    },
    {
      "id": "financial-data-stays-yours",
      "heading": "Financial data stays yours.",
      "body": [
        "Offline mode keeps quick calculations, notes, and reminders on your device. Online mode is used only when you ask for reasoning that needs it, and Akaya asks before any action that moves or shares information."
      ],
      "bullets": [
        "You choose what the Finance Agent can see.",
        "Sensitive actions require an explicit confirmation.",
        "Offline calculations never leave the device.",
        "No financial data is sold or used for advertising."
      ]
    },
    {
      "id": "understand-your-money-by-asking",
      "heading": "Understand your money by asking.",
      "body": [
        "Start with Akaya, then add the Shopping Agent to compare purchases before you spend, or the Job Search Agent to compare total compensation."
      ]
    }
  ]
};

export default agentsFinance;
