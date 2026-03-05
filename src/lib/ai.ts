import type { GenerationParams, OutlineItem, Slide } from '@/types/deck'

// OUTLINE GENERATION
export const OUTLINE_SYSTEM = `You are a presentation structure expert. Return ONLY valid JSON — no markdown, no backticks, no explanation. Raw JSON only.`

export const outlineUserPrompt = (p: GenerationParams) => `
Create a ${p.slideCount}-slide outline on: "${p.topic}"
Tone: ${p.tone} | Audience: ${p.audience}
- First slide: always type "title"
- Last slide: always type "title" (conclusion)
- Mix: bullets 60%, two-column 20%, quote 10%, title 10%
- Titles: max 6 words, action-oriented
Return: {"title":string,"slides":[{"position":number,"title":string,"type":"title"|"bullets"|"two-column"|"quote"}]}`

// SLIDE CONTENT GENERATION
export const SLIDE_SYSTEM = `You are a slide content writer. Concise and punchy. Return ONLY valid JSON — no markdown, no backticks.`

export const slideUserPrompt = (item: OutlineItem, p: GenerationParams) => `
Slide ${item.position}: "${item.title}" | Layout: ${item.type} | Tone: ${p.tone} | Topic: ${p.topic}
Rules:
- bullets: headline(max 8 words) + bullets(4-5 items, max 12 words, start with verb)
- two-column: headline + leftColumn(3 items) + rightColumn(3 items)
- title: headline(max 10 words) + body(max 25 words)
- quote: headline + quote(15-20 words) + attribution
- Always: speakerNotes(2 sentences)
Return: {"headline":string,"body"?:string,"bullets"?:string[],"leftColumn"?:string[],"rightColumn"?:string[],"quote"?:string,"attribution"?:string,"speakerNotes":string}`

// AI REWRITE
export const REWRITE_SYSTEM = `You are a slide editor. Rewrite per instruction. Keep identical JSON structure. Return valid JSON only.`

export const rewriteUserPrompt = (slide: Slide, instruction: string) => `
Slide: ${JSON.stringify(slide)}
Instruction: "${instruction}"
Return complete rewritten slide JSON with identical fields.`
