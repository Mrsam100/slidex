import type { GenerationParams, OutlineItem, Slide } from '@/types/deck'

/** Fast model for per-slide generation (called N times per deck) */
export const GEMINI_MODEL = 'gemini-2.5-flash'

/** Premium model for one-shot outline generation (called once per deck) */
export const GEMINI_MODEL_PRO = 'gemini-2.5-pro'

// ── OUTLINE GENERATION ──────────────────────────────────────────────

export const OUTLINE_SYSTEM = `You are a world-class presentation designer who creates compelling story arcs. You structure presentations like TED talks — each slide builds on the previous one, creating momentum and engagement.

CRITICAL: Return ONLY valid JSON. No markdown fences, no backticks, no explanation. Raw JSON only.`

export const outlineUserPrompt = (p: GenerationParams) => `
Design a ${p.slideCount}-slide presentation on: "${p.topic}"
Tone: ${p.tone} | Audience: ${p.audience}

STORY ARC RULES:
- Slide 1: Always "title" — a compelling, curiosity-provoking title (NOT just the topic repeated)
- Slide 2: Hook the audience — a surprising fact, question, or problem statement
- Middle slides: Build the narrative — each slide should feel like a natural next step
- Second-to-last: A powerful quote or key takeaway
- Last slide: Always "title" — a memorable closing statement or call-to-action

LAYOUT MIX (aim for variety — never put the same layout back-to-back):
- "bullets" — 40% of slides (for structured information)
- "two-column" — 25% (for comparisons, pros/cons, before/after)
- "quote" — 10% (for impactful statements from experts)
- "image-text" — 15% (for visual storytelling moments)
- "title" — 10% (opening + closing only)

TITLE RULES:
- Max 6 words per slide title
- Use active, engaging verbs: "Unlock", "Discover", "Transform", "Challenge", "Rethink"
- Never use generic titles like "Introduction", "Overview", "Conclusion", "Summary"
- Each title should make someone WANT to read the slide

Return: {"title":"<compelling deck title, max 12 words>","slides":[{"position":1,"title":"<slide title>","type":"title"|"bullets"|"two-column"|"quote"|"image-text"}]}`

// ── SLIDE CONTENT GENERATION ────────────────────────────────────────

export const SLIDE_SYSTEM = `You are a premium presentation content writer. You write like the best TED talk slide designers — every word earns its place. Your content is specific, vivid, and memorable. You never write generic filler.

WRITING STYLE:
- Use concrete numbers and data points instead of vague claims
- Start bullet points with strong action verbs
- Use the "So What?" test — every point must answer why the audience should care
- Headlines should be punchy insights, not boring topic labels
- Body text should feel like a conversation, not a textbook

CRITICAL: Return ONLY valid JSON. No markdown fences, no backticks, no explanation. Raw JSON only.`

export const slideUserPrompt = (item: OutlineItem, p: GenerationParams) => `
Slide ${item.position} of ${p.slideCount}: "${item.title}"
Layout: ${item.type} | Tone: ${p.tone} | Topic: ${p.topic} | Audience: ${p.audience}

CONTENT RULES BY LAYOUT:

For "bullets":
- headline: A punchy insight or claim (max 8 words) — NOT just a topic label
- bullets: 4-6 items, each 8-15 words
  · Start each with a strong verb: "Drive", "Eliminate", "Transform", "Leverage", "Unlock"
  · Include at least one bullet with a specific number, stat, or data point
  · Make each bullet a standalone insight (not a fragment that needs the headline)
- speakerNotes: 2-3 sentences expanding on the key points

For "two-column":
- headline: A contrast or comparison framing (max 8 words), e.g. "Traditional vs Modern", "Problems & Solutions"
- leftColumn: 3-4 items (8-12 words each) — clearly labeled perspective
- rightColumn: 3-4 items (8-12 words each) — contrasting perspective
- speakerNotes: 2-3 sentences explaining the comparison

For "title" (opening slide):
- headline: Compelling, curiosity-driven title (max 10 words)
- body: A powerful subtitle that sets the stage (15-25 words) — include the key promise or question
- speakerNotes: 2-3 sentences for the speaker's opening

For "title" (closing slide — position ${p.slideCount}):
- headline: A memorable call-to-action or key takeaway (max 10 words)
- body: The one thing you want the audience to remember (15-25 words)
- speakerNotes: 2-3 sentences for the speaker's closing

For "quote":
- headline: Context label (2-4 words), e.g. "Expert Insight", "Key Perspective"
- quote: An impactful, real quote relevant to the topic (15-25 words). Use REAL quotes from known figures when possible. Make it thought-provoking.
- attribution: Full name and title/role of the person quoted
- speakerNotes: 2-3 sentences connecting the quote to the presentation's argument

For "image-text":
- headline: A vivid, descriptive headline (max 8 words)
- body: 1-2 compelling sentences (30-50 words) that paint a picture or tell a mini-story
- bullets: 2-3 supporting points (optional, 8-12 words each)
- imageQuery: 2-3 keywords for finding a relevant photo (e.g. "solar panels rooftop", "doctor patient consultation", "team collaboration office"). Be specific and visual — not abstract concepts.
- speakerNotes: 2-3 sentences expanding on the visual narrative

Return: {"headline":"...","body":"...","bullets":["..."],"leftColumn":["..."],"rightColumn":["..."],"quote":"...","attribution":"...","imageQuery":"...","speakerNotes":"..."}`

// ── AI REWRITE ──────────────────────────────────────────────────────

export const REWRITE_SYSTEM = `You are an expert slide editor. When rewriting, maintain the same JSON structure but dramatically improve the content quality. Make text more vivid, specific, and engaging. If asked to simplify, cut ruthlessly. If asked to expand, add concrete details and examples.

CRITICAL: Return ONLY valid JSON. No markdown fences, no backticks, no explanation. Raw JSON only.`

export const rewriteUserPrompt = (slide: Slide, instruction: string) => `
Current slide content:
${JSON.stringify({
  layout: slide.layout,
  headline: slide.headline,
  body: slide.body,
  bullets: slide.bullets,
  leftColumn: slide.leftColumn,
  rightColumn: slide.rightColumn,
  quote: slide.quote,
  attribution: slide.attribution,
  speakerNotes: slide.speakerNotes,
})}

User instruction: "${instruction}"

Rewrite the slide following the instruction. Keep the same JSON fields. Return only the content fields (headline, body, bullets, leftColumn, rightColumn, quote, attribution, speakerNotes).`
