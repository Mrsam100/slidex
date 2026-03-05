'use client'

import { Keyboard, ListChecks, CheckCircle } from 'lucide-react'
import { FadeUp, FadeScale, MagneticCard, CursorSpotlight, RevealWipe, motion } from './motion'
import type { ReactNode } from 'react'

interface Step {
  step: number
  title: string
  description: string
  icon: typeof Keyboard
  visual: ReactNode
}

const steps: Step[] = [
  {
    step: 1,
    title: 'Type Your Topic',
    description:
      'Enter your presentation topic, pick the tone and audience, and choose how many slides you need.',
    icon: Keyboard,
    visual: (
      <div className="mt-6 space-y-2 rounded-xl border border-white/10 bg-[#0A0A0A] p-4">
        <div className="h-3 w-3/4 rounded bg-white/10" />
        <div className="h-3 w-1/2 rounded bg-white/10" />
        <div className="mt-3 flex gap-2">
          {['Academic', 'Professional', 'Casual'].map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-400"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    step: 2,
    title: 'Review the Outline',
    description:
      'AI generates a structured outline with slide titles and layouts. Review, reorder, and approve.',
    icon: ListChecks,
    visual: (
      <div className="mt-6 space-y-2 rounded-xl border border-white/10 bg-[#0A0A0A] p-4">
        {['Introduction', 'Key Concepts', 'Case Study', 'Summary'].map(
          (item, i) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2"
            >
              <span className="text-xs font-bold text-purple-400">
                {i + 1}
              </span>
              <span className="text-sm text-gray-300">{item}</span>
            </div>
          ),
        )}
      </div>
    ),
  },
  {
    step: 3,
    title: 'Get Your Deck',
    description:
      'Slides are generated with real content, smart layouts, and speaker notes. Export as PDF or share.',
    icon: CheckCircle,
    visual: (
      <div className="mt-6 space-y-2 rounded-xl border border-white/10 bg-[#0A0A0A] p-4">
        {[
          { label: 'Slides generated' },
          { label: 'Speaker notes' },
          { label: 'PDF export ready' },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
          >
            <span className="text-sm text-gray-300">{item.label}</span>
            <CheckCircle className="h-4 w-4 text-brand-teal" />
          </div>
        ))}
      </div>
    ),
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#0D0D0D] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <FadeUp className="mb-16 text-center">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300">
            How It Works
          </span>
          <h2 className="mt-6 text-4xl font-bold text-white md:text-5xl">
            From Topic to Deck
            <br className="hidden md:block" /> in Three Steps
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-400">
            We design, generate, and export beautiful slide decks that help you
            present smarter, not harder.
          </p>
        </FadeUp>

        {/* 3 step cards — staggered scale-in with magnetic tilt */}
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <FadeScale key={s.step} delay={i * 0.15}>
              <MagneticCard>
                <CursorSpotlight>
                  <div className="rounded-xl border border-white/10 bg-[#111] p-8 transition-colors hover:border-purple-500/30">
                    <motion.span
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: 0.2 + i * 0.15,
                        type: 'spring',
                        stiffness: 300,
                      }}
                      className="inline-flex items-center rounded bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-400"
                    >
                      Step {s.step}
                    </motion.span>
                    <h3 className="mt-4 text-xl font-bold text-white">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-400">
                      {s.description}
                    </p>
                    <RevealWipe direction="up">
                      {s.visual}
                    </RevealWipe>
                  </div>
                </CursorSpotlight>
              </MagneticCard>
            </FadeScale>
          ))}
        </div>

        {/* Connecting dashed line on desktop */}
        <div className="mx-auto mt-8 hidden max-w-2xl md:block">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-px origin-left border-t border-dashed border-white/20"
          />
        </div>
      </div>
    </section>
  )
}
