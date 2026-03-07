import type { SlideLayout } from '@/types/deck'

export interface TemplateCategory {
  id: string
  name: string
}

export interface TemplateSlide {
  position: number
  layout: SlideLayout
  headline: string
  body?: string
  bullets?: string[]
  leftColumn?: string[]
  rightColumn?: string[]
  quote?: string
  attribution?: string
  speakerNotes?: string
  bgImageUrl?: string
  sectionTag?: string
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  theme: string
  slideCount: number
  slides: TemplateSlide[]
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: 'all', name: 'All' },
  { id: 'business', name: 'Business' },
  { id: 'education', name: 'Education' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'creative', name: 'Creative' },
  { id: 'technical', name: 'Technical' },
]

export const TEMPLATES: Template[] = [
  // ─── TEMPLATE 1: STARTUP PITCH DECK ────────────────────────
  {
    id: 'startup-pitch',
    name: 'Startup Pitch Deck',
    description: 'Win investors with a compelling startup narrative. Problem, solution, market, traction, and the ask.',
    category: 'business',
    theme: 'dark',
    slideCount: 10,
    slides: [
      {
        position: 1,
        layout: 'title',
        headline: '[Your Company Name]',
        body: 'The one-liner that explains what you do and why it matters. Replace this with your elevator pitch.',
        bgImageUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Open with energy. State your company name clearly and deliver your one-liner with conviction.',
      },
      {
        position: 2,
        layout: 'bullets',
        headline: 'The Problem',
        sectionTag: 'Pain Point',
        bullets: [
          'Describe the pain point your target customer faces daily',
          'Quantify it: how much time, money, or effort is wasted',
          'Explain why existing solutions fall short',
          'Share a real story or scenario that makes it tangible',
        ],
        bgImageUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Make the audience feel the problem. Use a specific example or anecdote from a real customer.',
      },
      {
        position: 3,
        layout: 'bullets',
        headline: 'Our Solution',
        sectionTag: 'The Product',
        bullets: [
          'One sentence: what your product does in plain language',
          'Key differentiator that sets you apart from alternatives',
          'How it works in 3 simple steps for the end user',
          'The "aha moment" that hooks customers in the first session',
        ],
        bgImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Keep it simple. If you can demo the product, this is the moment. Show, dont tell.',
      },
      {
        position: 4,
        layout: 'two-column',
        headline: 'Before vs After',
        sectionTag: 'Transformation',
        leftColumn: [
          'Manual processes eating 10+ hours per week',
          'Data scattered across 5 different tools',
          'Decisions based on gut feeling, not insights',
        ],
        rightColumn: [
          'Automated workflows saving 80% of time',
          'Single source of truth in one dashboard',
          'Data-driven decisions with real-time analytics',
        ],
        bgImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'This contrast makes your value proposition visceral. Use real numbers from your customers if possible.',
      },
      {
        position: 5,
        layout: 'bullets',
        headline: 'Market Opportunity',
        sectionTag: 'Market Size',
        bullets: [
          'Total Addressable Market (TAM): $[X]B globally',
          'Serviceable Addressable Market (SAM): $[X]B in your region',
          'Serviceable Obtainable Market (SOM): $[X]M in year one',
          'Market growing at [X]% CAGR driven by [key trend]',
        ],
        bgImageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Investors want to see a big market. Be honest about your initial target segment but show the expansion path.',
      },
      {
        position: 6,
        layout: 'bullets',
        headline: 'Traction So Far',
        sectionTag: 'Growth Metrics',
        bullets: [
          '[X] paying customers with [Y]% month-over-month growth',
          '$[X]K in annual recurring revenue (ARR)',
          '[X]% customer retention rate over 12 months',
          'Key partnerships: [Partner 1], [Partner 2]',
          'Featured in [Publication] and [Award/Recognition]',
        ],
        bgImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'This is where you prove it is not just an idea. Lead with your strongest metric.',
      },
      {
        position: 7,
        layout: 'two-column',
        headline: 'Business Model',
        sectionTag: 'Revenue',
        leftColumn: [
          'Freemium: free tier drives acquisition',
          'Pro plan: $[X]/month per user',
          'Enterprise: custom pricing with SLA',
        ],
        rightColumn: [
          'Average revenue per user: $[X]/month',
          'Customer acquisition cost: $[X]',
          'Lifetime value: $[X] (LTV/CAC ratio: [X]x)',
        ],
        bgImageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Show you understand unit economics. LTV/CAC ratio above 3x is the gold standard for SaaS.',
      },
      {
        position: 8,
        layout: 'bullets',
        headline: 'The Team',
        sectionTag: 'Leadership',
        bullets: [
          '[CEO Name] — 10 years in [industry], previously at [Company]',
          '[CTO Name] — Built [notable product], ex-[Big Tech Company]',
          '[Head of Sales] — Scaled revenue 0 to $[X]M at [Company]',
          'Advisory board: [Notable Advisor 1], [Notable Advisor 2]',
        ],
        bgImageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Investors bet on teams. Highlight relevant experience and why THIS team is uniquely positioned to win.',
      },
      {
        position: 9,
        layout: 'quote',
        headline: 'What Customers Say',
        sectionTag: 'Social Proof',
        quote: 'This product completely transformed how our team operates. We saved 15 hours per week and finally have visibility into our pipeline.',
        attribution: '[Customer Name], [Title] at [Company]',
        bgImageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Social proof is powerful. Use a real quote from your happiest customer.',
      },
      {
        position: 10,
        layout: 'title',
        headline: 'The Ask: $[X]M Seed Round',
        body: 'Funds allocated to: 50% engineering, 30% go-to-market, 20% operations. Runway: 18 months to Series A milestones.',
        sectionTag: 'Investment',
        bgImageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Be specific about how you will use the money and what milestones it unlocks. End with confidence.',
      },
    ],
  },

  // ─── TEMPLATE 2: CLASSROOM LESSON PLAN ─────────────────────
  {
    id: 'classroom-lesson',
    name: 'Classroom Lesson Plan',
    description: 'Engage students with a structured lesson. Learning objectives, key concepts, activities, and assessment.',
    category: 'education',
    theme: 'minimal',
    slideCount: 8,
    slides: [
      {
        position: 1,
        layout: 'title',
        headline: '[Lesson Title Goes Here]',
        body: '[Subject] — Grade [X] | [Date] | Instructor: [Your Name]',
        bgImageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Welcome students. Briefly preview what they will learn today and why it matters.',
      },
      {
        position: 2,
        layout: 'bullets',
        headline: 'Learning Objectives',
        sectionTag: 'Goals',
        bullets: [
          'By the end of this lesson, students will be able to [objective 1]',
          'Students will understand the relationship between [concept A] and [concept B]',
          'Students will apply [skill] to solve real-world problems',
          'Students will evaluate [topic] using critical thinking frameworks',
        ],
        bgImageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Review objectives at the start so students know what to focus on. Refer back to these at the end.',
      },
      {
        position: 3,
        layout: 'quote',
        headline: 'Think About This',
        sectionTag: 'Warm-Up',
        quote: '[Insert a thought-provoking question or surprising fact that hooks students into the topic. Make them curious before you teach.]',
        attribution: 'Opening Question for Discussion',
        bgImageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Give students 30 seconds to think individually, then 1 minute to discuss with a neighbor before sharing.',
      },
      {
        position: 4,
        layout: 'bullets',
        headline: 'Key Concept: [Topic Name]',
        sectionTag: 'Core Content',
        bullets: [
          'Definition: [Clear, student-friendly explanation of the core concept]',
          'Why it matters: [Real-world connection that makes it relevant]',
          'Common misconception: [What students often get wrong and why]',
          'Remember: [Simple memory aid or mnemonic device]',
        ],
        bgImageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Break this down step by step. Use the whiteboard for visual diagrams.',
      },
      {
        position: 5,
        layout: 'two-column',
        headline: 'Examples vs Non-Examples',
        sectionTag: 'Practice',
        leftColumn: [
          '[Correct example 1 with brief explanation]',
          '[Correct example 2 showing a different angle]',
          '[Correct example 3 for advanced understanding]',
        ],
        rightColumn: [
          '[Common mistake 1 and why it is wrong]',
          '[Common mistake 2 students often make]',
          '[Tricky edge case to watch out for]',
        ],
        bgImageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Walk through each example. Ask students to identify WHY the non-examples are incorrect.',
      },
      {
        position: 6,
        layout: 'bullets',
        headline: 'Hands-On Activity',
        sectionTag: 'Group Work',
        bullets: [
          'Activity: [Describe the activity in 1 sentence]',
          'Materials needed: [List what students need]',
          'Work in groups of [X] for [X] minutes',
          'Present your findings to the class in a 2-minute summary',
          'Extension challenge: [Harder version for fast finishers]',
        ],
        bgImageUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Circulate the room while students work. Ask probing questions to deepen understanding.',
      },
      {
        position: 7,
        layout: 'bullets',
        headline: 'Quick Check: Did You Get It?',
        sectionTag: 'Assessment',
        bullets: [
          'Question 1: [Recall-level question testing basic understanding]',
          'Question 2: [Application question requiring them to use the concept]',
          'Question 3: [Analysis question connecting to prior knowledge]',
          'Bonus: [Creative extension that goes beyond the lesson]',
        ],
        bgImageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Use these as exit ticket questions. Collect responses to inform tomorrow\'s lesson planning.',
      },
      {
        position: 8,
        layout: 'title',
        headline: 'What We Learned Today',
        body: '[Summarize the 3 key takeaways in one sentence]. Homework: [Assignment description] due [date].',
        sectionTag: 'Recap',
        bgImageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=1280&h=720&fit=crop&q=80',
        speakerNotes: 'Recap the learning objectives. Highlight what students did well. Preview what is coming next class.',
      },
    ],
  },
]

/** Get a template by ID */
export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id)
}
