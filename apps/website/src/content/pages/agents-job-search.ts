// Imported from akaya-voice-flow by scripts/import-voice-flow.mjs. Safe to edit by hand (or from the admin panel later).
import type { PageContent } from '../types';

const agentsJobSearch: PageContent = {
  "key": "agents-job-search",
  "kind": "agent",
  "path": "/agents/job-search",
  "bubble": "violet",
  "seo": {
    "title": "AI Job Search Assistant — Find Better Jobs with Akaya",
    "description": "Akaya Job Search Agent searches, filters, matches, and ranks job opportunities based on your skills, experience, location, and salary goals.",
    "keywords": [
      "ai job search assistant",
      "ai job finder",
      "job search agent"
    ],
    "path": "/agents/job-search",
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
        "name": "AI Job Search Assistant",
        "path": "/agents/job-search"
      }
    ]
  },
  "demo": {
    "agent": "Job Search Agent",
    "prompt": "“Find me a senior product designer role.”",
    "steps": [
      "Understand your profile",
      "Search supported job platforms",
      "Filter by fit and salary",
      "Rank the best matches"
    ],
    "result": "Top matches shortlisted for you."
  },
  "hero": {
    "id": "your-next-job-found-by-akaya",
    "heading": "Your next job, found by Akaya.",
    "body": [
      "Akaya searches, compares, ranks, and helps you act on opportunities that fit your role, location, and compensation goals — with US salary data in USD."
    ]
  },
  "sections": [
    {
      "id": "watch-the-agent-work-end-to-end",
      "heading": "Watch the agent work, end to end.",
      "body": [
        "One continuous workflow: you speak, Akaya understands, searches every platform, ranks the results and tells you what deserves your attention.",
        "What kind of job are you looking for?"
      ]
    },
    {
      "id": "let-akaya-do-the-searching",
      "heading": "Let Akaya do the searching.",
      "body": [
        "Your job search runs in the background while you focus on what matters."
      ],
      "bullets": [
        "Akaya Job Search Agent · running",
        "Senior Software Engineer · 96% Match",
        "$145K–$175K · Austin, TX"
      ]
    },
    {
      "id": "a-search-that-runs-itself",
      "heading": "A search that runs itself."
    },
    {
      "id": "not-more-jobs-better-jobs",
      "heading": "Not more jobs. Better jobs.",
      "body": [
        "Akaya ranks every opportunity against the preferences you define, so the top of your list is always the part worth reading.",
        "Salary is $12K above your target.",
        "AI Insight: Above your target range and competitive for this role."
      ],
      "bullets": [
        "Senior Software Engineer",
        "TechNova · $145K–$175K/year"
      ]
    },
    {
      "id": "the-right-opportunity-can-find-you",
      "heading": "The right opportunity can find you.",
      "body": [
        "Akaya keeps watching after the first search and pings you only when something clears your match score."
      ]
    },
    {
      "id": "your-job-search-stays-yours",
      "heading": "Your job search stays yours.",
      "items": [
        {
          "title": "Private preferences",
          "text": "Your search profile is tied to your account, not shared publicly."
        },
        {
          "title": "Secure account",
          "text": "Sign in with email or Google, protected by your Akaya account."
        },
        {
          "title": "You control applications",
          "text": "Akaya prepares the application. You review and decide when to apply."
        }
      ]
    },
    {
      "id": "stop-searching-start-discovering",
      "heading": "Stop searching. Start discovering.",
      "body": [
        "Tell Akaya what you're looking for and let your AI Job Search Agent find the opportunities that fit."
      ]
    }
  ]
};

export default agentsJobSearch;
