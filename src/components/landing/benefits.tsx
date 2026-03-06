'use client'

import {
  Zap,
  Palette,
  Clock,
  DollarSign,
  BarChart3,
  Users,
} from 'lucide-react'
import { FadeUp, StaggerContainer, StaggerItem, MagneticCard, CursorSpotlight, motion } from './motion'

const benefits = [
  {
    icon: Zap,
    title: 'Generate in Seconds',
    description:
      'Type a topic, pick your preferences, and get a full slide deck instantly — no design skills needed.',
  },
  {
    icon: Palette,
    title: 'Designed, Not Generated',
    description:
      'Slides that look professionally crafted with real typography, smart layouts, and cohesive themes.',
  },
  {
    icon: Clock,
    title: 'Available 24/7',
    description:
      'Create presentations anytime, anywhere. No installations, no waiting — just your browser.',
  },
  {
    icon: DollarSign,
    title: 'Free to Start',
    description:
      'Create unlimited decks at zero cost. No credit card, no limits — just great presentations.',
  },
  {
    icon: BarChart3,
    title: 'Multiple Formats',
    description:
      'Bullets, two-column, quotes, and title slides — the AI picks the best layout for every slide.',
  },
  {
    icon: Users,
    title: 'Built for Education',
    description:
      'Tailored for students and educators with academic tones, clear structure, and export-ready decks.',
  },
]

export function Benefits() {
  return (
    <section className="bg-dark px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <FadeUp className="mb-16 text-center">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300">
            Benefits
          </span>
          <h2 className="mt-6 text-4xl font-bold text-white md:text-5xl">
            The Key Benefits of SlideX
            <br className="hidden md:block" /> for Your Presentations
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-400">
            Discover how AI-powered slide generation saves time, improves
            quality, and makes presenting effortless.
          </p>
        </FadeUp>

        {/* 3x2 grid — staggered reveal with magnetic tilt + spotlight */}
        <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <StaggerItem key={b.title}>
              <MagneticCard>
                <CursorSpotlight>
                  <div className="rounded-xl border border-white/10 bg-[#111] p-6 transition-colors hover:border-brand-blue/30">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10"
                    >
                      <b.icon className="h-5 w-5 text-brand-blue" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-white">
                      {b.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-400">
                      {b.description}
                    </p>
                  </div>
                </CursorSpotlight>
              </MagneticCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
