'use client'

import { Star } from 'lucide-react'
import { FadeUp } from './motion'

const testimonials = [
  {
    name: 'Elena Rossi',
    role: 'Professor, MIT',
    initial: 'E',
    color: 'bg-purple-500/60',
    stars: 5,
    quote:
      'SlideX has completely changed how I prepare lectures. My slides are cleaner, more structured, and my students love them.',
  },
  {
    name: 'Marcus Chen',
    role: 'Founder, EduTech Labs',
    initial: 'M',
    color: 'bg-red-500/60',
    stars: 5,
    quote:
      'The AI generation is incredibly fast. I went from spending hours on presentations to minutes. The quality is honestly better than what I used to make manually.',
  },
  {
    name: 'Sarah Jenkins',
    role: 'High School Teacher',
    initial: 'S',
    color: 'bg-brand-teal/60',
    stars: 5,
    quote:
      'Finally, an AI tool that makes slides look designed, not generated. The themes are beautiful and my presentations look professional.',
  },
  {
    name: 'Alex Rivera',
    role: 'PhD Candidate',
    initial: 'A',
    color: 'bg-amber-500/60',
    stars: 5,
    quote:
      "I'm amazed at the academic tone option. It creates well-structured slides perfect for research presentations and thesis defenses.",
  },
  {
    name: 'Priya Patel',
    role: 'Business Consultant',
    initial: 'P',
    color: 'bg-fuchsia-500/60',
    stars: 5,
    quote:
      'The export and share features are seamless. I generate a deck, share the link with clients, and they always ask how I made it so fast.',
  },
  {
    name: 'David Kim',
    role: 'Curriculum Designer',
    initial: 'D',
    color: 'bg-blue-500/60',
    stars: 5,
    quote:
      'I used to dread making slide decks. Now I actually look forward to it. SlideX makes the whole process feel effortless and creative.',
  },
]

function TestimonialCard({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <div className="w-80 shrink-0 rounded-2xl border border-white/10 bg-[#111] p-6 transition-colors hover:border-purple-500/30">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${t.color}`}
        >
          {t.initial}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{t.name}</p>
          <p className="text-xs text-gray-400">{t.role}</p>
        </div>
      </div>

      {/* Stars */}
      <div className="mt-4 flex gap-0.5">
        {Array.from({ length: t.stars }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 fill-purple-400 text-purple-400"
          />
        ))}
      </div>

      {/* Quote */}
      <p className="mt-4 text-sm leading-relaxed text-gray-300">
        &ldquo;{t.quote}&rdquo;
      </p>
    </div>
  )
}

export function Testimonials() {
  // Duplicate for seamless infinite loop
  const allCards = [...testimonials, ...testimonials]

  return (
    <section className="bg-dark py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <FadeUp className="mb-16 text-center">
          <h2 className="text-4xl font-bold italic text-white md:text-5xl">
            What People Say About SlideX
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Hear from educators and professionals who transformed their
            presentations.
          </p>
        </FadeUp>
      </div>

      {/* Infinite marquee — auto-scrolling */}
      <div className="relative overflow-hidden">
        {/* Left fade */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-dark to-transparent" />
        {/* Right fade */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-dark to-transparent" />

        <div className="marquee-container flex w-max gap-6 hover:[animation-play-state:paused]">
          {allCards.map((t, i) => (
            <TestimonialCard key={`${t.name}-${i}`} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}
