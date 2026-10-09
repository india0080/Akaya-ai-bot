/**
 * Sample recordings used by demo mode (streamed word by word as if spoken) and as seed data.
 * Names are sample people only. Hints mark the structure a real summariser would infer.
 */
import type { Segment, SegmentHint, SpeechLang } from './types';

export interface ScriptLine {
  /** seconds from start */
  at: number;
  text: string;
  speaker?: string;
  lang?: SpeechLang;
  hint?: SegmentHint;
}

export const LECTURE: ScriptLine[] = [
  {
    at: 0.6,
    text: 'Good morning everyone. Today we will discuss eigenvalues and eigenvectors.',
    hint: { section: 'Eigenvalues & eigenvectors', point: 'Topic: eigenvalues and eigenvectors', idea: 'Overview' },
  },
  {
    at: 4.6,
    text: 'Eigenvalues are scalars that tell us how much a linear transformation stretches or shrinks a vector.',
    hint: {
      point: 'Eigenvalues tell how much a transformation stretches or shrinks a vector',
      term: ['Eigenvalue (λ)', 'Scalar showing how much A stretches or shrinks a vector'],
      idea: 'Stretch factor',
      summary: 'Eigenvalues measure how much a matrix stretches or shrinks a vector.',
    },
  },
  {
    at: 10,
    text: 'If A is a square matrix, a non-zero vector v is called an eigenvector of A if A v equals lambda v.',
    hint: {
      section: 'Mathematical definition',
      formula: 'Av = λv',
      point: 'A non-zero vector v with Av = λv is an eigenvector of A',
      term: ['Eigenvector (v)', 'Non-zero vector whose direction A does not change'],
      idea: 'Av = λv',
    },
  },
  {
    at: 15.6,
    text: 'In simple words, the direction stays the same and only the magnitude changes by lambda.',
    hint: { point: 'Direction stays the same; only the magnitude changes by λ', idea: 'Same direction' },
  },
  {
    at: 20.2,
    text: 'To find them, we solve the characteristic equation: determinant of A minus lambda I equals zero.',
    hint: {
      section: 'Finding eigenvalues',
      formula: 'det(A − λI) = 0',
      point: 'Solve the characteristic equation det(A − λI) = 0',
      idea: 'Characteristic eqn',
      summary: 'Eigenvalues come from the characteristic equation det(A − λI) = 0.',
    },
  },
  {
    at: 25.6,
    text: 'For a two by two matrix this gives a quadratic, so we get at most two eigenvalues.',
    hint: { point: '2×2 matrix → quadratic → at most two eigenvalues', idea: '≤ 2 for 2×2' },
  },
  {
    at: 30.4,
    text: "Let's take A equals two one, one two. The eigenvalues come out as three and one.",
    hint: { section: 'Worked example', point: 'A = [2 1; 1 2] gives λ = 3 and λ = 1', idea: 'λ = 3 and 1' },
  },
  {
    at: 35.2,
    text: 'For lambda equals three the eigenvector is one, one. For lambda equals one it is one, minus one.',
    hint: { point: 'λ = 3 → v = (1, 1);  λ = 1 → v = (1, −1)', idea: 'v = (1,1), (1,−1)' },
  },
  {
    at: 40.4,
    text: "Eigenvalues are used in diagonalisation, PCA in machine learning, and Google's PageRank.",
    hint: {
      section: 'Applications',
      point: 'Diagonalisation, PCA in machine learning, PageRank',
      idea: 'PCA · PageRank',
      summary: 'Used in diagonalisation, PCA and PageRank.',
    },
  },
  {
    at: 45.6,
    text: 'Remember, the sum of the eigenvalues equals the trace, and their product equals the determinant.',
    hint: { section: 'Key points', point: 'Sum of eigenvalues = trace; product = determinant', idea: 'Trace · det' },
  },
  {
    at: 51,
    text: "For homework, solve exercise 3.2, questions one to eight, before Monday's class.",
    hint: {
      action: { text: 'Solve exercise 3.2, Q1–8', owner: 'You', due: 'Mon' },
      summary: 'Homework: exercise 3.2 (Q1–8) before Monday.',
    },
  },
  {
    at: 56,
    text: "Next class we'll start diagonalisation, so please revise matrix multiplication.",
    hint: {
      action: { text: 'Revise matrix multiplication', owner: 'You', due: 'Next class' },
      point: 'Next class: diagonalisation',
    },
  },
];

export const BUSINESS: ScriptLine[] = [
  {
    at: 0.6,
    speaker: 'Priya',
    text: 'Thanks for joining, Rahul and Neha. Today we finalise the Q4 launch plan for Akaya Pro.',
    hint: {
      attendees: ['Priya', 'Rahul', 'Neha'],
      section: 'Agenda',
      point: 'Finalise the Q4 launch plan for Akaya Pro',
      idea: 'Q4 launch',
    },
  },
  {
    at: 5.4,
    speaker: 'Rahul',
    text: 'The beta has 4,200 users and weekly retention is at 61 percent.',
    hint: {
      section: 'Beta update',
      point: '4,200 beta users · 61% weekly retention',
      idea: '61% retention',
      summary: 'Beta: 4,200 users with 61% weekly retention.',
    },
  },
  {
    at: 10,
    speaker: 'Neha',
    text: 'Feedback says users love Floating reply, but onboarding takes too long.',
    hint: { point: 'Users love Floating reply; onboarding feels too long', idea: 'Onboarding too long' },
  },
  {
    at: 14.6,
    speaker: 'Priya',
    text: "Okay, let's cut onboarding to three screens before launch. Neha, can you own that by October 20th?",
    hint: {
      decision: 'Cut onboarding to 3 screens before launch',
      action: { text: 'Redesign onboarding to 3 screens', owner: 'Neha', due: '20 Oct' },
    },
  },
  {
    at: 20.6,
    speaker: 'Rahul',
    text: 'On pricing, I suggest 199 rupees a month with a seven day free trial.',
    hint: { section: 'Pricing', point: 'Proposal: ₹199/month with a 7-day free trial', idea: '₹199 / month' },
  },
  {
    at: 25.4,
    speaker: 'Neha',
    text: 'Agreed. Students could get fifty percent off with a college email.',
    hint: { point: 'Student plan: 50% off with a college email', idea: 'Student 50% off' },
  },
  {
    at: 30,
    speaker: 'Priya',
    text: "Great, so we're decided: 199 a month, trial included, and the student discount at launch.",
    hint: {
      decision: 'Pricing: ₹199/month, 7-day trial, 50% student discount',
      summary: 'Pricing agreed: ₹199/month, 7-day trial, 50% off for students.',
    },
  },
  {
    at: 35.4,
    speaker: 'Rahul',
    text: "I'll set up Razorpay subscriptions and share a test link by Friday.",
    hint: {
      section: 'Launch plan',
      action: { text: 'Set up Razorpay subscriptions + test link', owner: 'Rahul', due: 'Fri' },
      idea: 'Razorpay',
    },
  },
  {
    at: 40.2,
    speaker: 'Priya',
    text: 'Launch date is November 14th, with a Diwali offer in the first week.',
    hint: {
      decision: 'Launch on 14 Nov with a Diwali offer in week one',
      point: 'Launch 14 Nov · Diwali offer in week one',
      idea: '14 Nov launch',
      summary: 'Launch on 14 November with a Diwali offer.',
    },
  },
  {
    at: 45.4,
    speaker: 'Neha',
    text: "I'll prepare the Play Store listing and screenshots by October 31st.",
    hint: { action: { text: 'Play Store listing + screenshots', owner: 'Neha', due: '31 Oct' }, idea: 'Store listing' },
  },
  {
    at: 50.2,
    speaker: 'Priya',
    text: "And I'll brief the press team on Tuesday. Let's meet again next Monday.",
    hint: { action: { text: 'Brief the press team', owner: 'Priya', due: 'Tue' }, point: 'Next sync: Monday' },
  },
];

export const SEED_CALCULUS: ScriptLine[] = [
  {
    at: 4,
    text: 'Today we start derivatives, which measure the rate of change of a function.',
    hint: {
      section: 'What is a derivative',
      point: 'A derivative measures the rate of change of a function',
      term: ['Derivative', 'Instantaneous rate of change of f(x)'],
      idea: 'Rate of change',
    },
  },
  {
    at: 186,
    text: 'Geometrically, the derivative is the slope of the tangent line at a point.',
    hint: { point: 'It is the slope of the tangent at a point', idea: 'Tangent slope' },
  },
  {
    at: 431,
    text: 'The power rule says the derivative of x to the n is n times x to the n minus one.',
    hint: { section: 'Rules', formula: 'd/dx xⁿ = n·xⁿ⁻¹', point: 'Power rule: d/dx xⁿ = n·xⁿ⁻¹', idea: 'Power rule' },
  },
  {
    at: 694,
    text: 'The product rule: derivative of u v is u dash v plus u v dash.',
    hint: { formula: '(uv)′ = u′v + uv′', point: 'Product rule: (uv)′ = u′v + uv′', idea: 'Product rule' },
  },
  {
    at: 1013,
    text: 'Derivatives help us find maxima and minima, like the best price for a product.',
    hint: {
      section: 'Applications',
      point: 'Find maxima and minima (e.g. best price)',
      idea: 'Max / min',
      summary: 'Derivatives find maxima and minima.',
    },
  },
  {
    at: 1548,
    text: 'Practice sheet two is due on Thursday.',
    hint: { action: { text: 'Submit practice sheet 2', owner: 'You', due: 'Thu' } },
  },
];

export const SEED_SALES: ScriptLine[] = [
  {
    at: 3,
    speaker: 'Rahul',
    text: 'Sales are up 18 percent this month, mostly from Pune and Bengaluru.',
    hint: {
      attendees: ['Rahul', 'Neha', 'Priya'],
      section: 'Numbers',
      point: 'Sales up 18% · led by Pune and Bengaluru',
      idea: '+18%',
      summary: 'Sales up 18% this month.',
    },
  },
  {
    at: 164,
    speaker: 'Neha',
    text: 'Delhi is behind target because two distributors paused orders.',
    hint: { point: 'Delhi behind target: two distributors paused orders', idea: 'Delhi gap' },
  },
  {
    at: 421,
    speaker: 'Priya',
    text: 'Let’s offer Delhi distributors a festive scheme for October.',
    hint: {
      section: 'Delhi plan',
      point: 'Offer Delhi distributors a festive scheme in October',
      decision: 'Festive scheme for Delhi distributors in October',
      idea: 'Festive scheme',
    },
  },
  {
    at: 702,
    speaker: 'Rahul',
    text: 'I will call both distributors tomorrow and send a recap.',
    hint: { action: { text: 'Call both Delhi distributors + send recap', owner: 'Rahul', due: 'Tomorrow' } },
  },
  {
    at: 1011,
    speaker: 'Neha',
    text: 'I will update the sales dashboard by Wednesday.',
    hint: {
      action: { text: 'Update the sales dashboard', owner: 'Neha', due: 'Wed' },
      summary: 'Rahul calls distributors; Neha updates the dashboard.',
    },
  },
];

export const SEED_IDEAS: ScriptLine[] = [
  {
    at: 2,
    text: 'Idea for the Diwali campaign: short videos of families using Akaya to plan the festival.',
    hint: {
      section: 'Campaign ideas',
      point: 'Short videos: families planning Diwali with Akaya',
      idea: 'Family videos',
    },
  },
  {
    at: 61,
    lang: 'hi-IN',
    text: 'दिवाली पर परिवार के साथ वीडियो कॉल वाला आइडिया भी अच्छा है।',
    hint: { point: 'Video call with family on Diwali (Hindi)', idea: 'Video calls' },
  },
  {
    at: 143,
    text: 'Maybe a Hindi and Tamil version of the ad, with greeting templates in the app.',
    hint: { point: 'Hindi + Tamil ad versions; greeting templates in app', idea: 'Regional ads' },
  },
  {
    at: 262,
    text: 'Next step: share these with Neha before Friday.',
    hint: {
      action: { text: 'Share campaign ideas with Neha', owner: 'You', due: 'Fri' },
      summary: 'Three Diwali campaign ideas; share with Neha by Friday.',
    },
  },
];

/** Turn script lines into transcript segments. */
export const toSegments = (lines: ScriptLine[], prefix: string): Segment[] =>
  lines.map((l, i) => ({
    id: `${prefix}-${i}`,
    t: l.at,
    text: l.text,
    speaker: l.speaker,
    lang: l.lang ?? 'en-IN',
    hint: l.hint,
  }));
