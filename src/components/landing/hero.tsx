'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { PulseGlow, Float, TextScramble, Typewriter } from './motion'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-dark px-6 py-24 text-center md:py-36">
      {/* Glowing orb — animated pulse + float */}
      <Float duration={8}>
        <PulseGlow>
          <div
            className="pointer-events-none absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue/15 blur-[100px]" />
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue/25 blur-[80px]" />
            <div className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-teal/30 blur-[60px]" />
            <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-blue/10 bg-brand-teal/10 blur-[50px]" />
          </div>
        </PulseGlow>
      </Float>

      {/* Animated floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full bg-brand-blue/40"
          style={{
            left: `${10 + i * 11}%`,
            top: `${15 + (i % 4) * 20}%`,
            width: i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 2,
            height: i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 2,
          }}
          animate={{
            y: [0, -40 - i * 5, 0],
            x: [0, (i % 2 === 0 ? 15 : -15), 0],
            opacity: [0.1, 0.9, 0.1],
            scale: [1, 1.8, 1],
          }}
          transition={{
            duration: 3 + i * 0.7,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Animated grid lines background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`vline-${i}`}
            className="absolute top-0 h-full w-px bg-brand-blue"
            style={{ left: `${(i + 1) * 8}%` }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.5, delay: i * 0.1, ease: 'easeOut' }}
          />
        ))}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`hline-${i}`}
            className="absolute left-0 h-px w-full bg-brand-blue"
            style={{ top: `${(i + 1) * 12}%` }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-3xl">
        {/* Badge — spring bounce in */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.2,
            type: 'spring',
            stiffness: 200,
          }}
          className="mb-8 inline-flex items-center rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-1.5 text-xs font-medium text-brand-teal"
        >
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-brand-teal"
          />
          Now in public beta
        </motion.div>

        {/* Headline — text scramble decode effect */}
        <h1 className="text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
          <TextScramble text="Beautiful slides." className="block" delay={0.3} />
          <TextScramble text="In seconds." className="block" delay={0.8} />
        </h1>

        {/* Subtitle — typewriter effect */}
        <div className="mx-auto mt-6 max-w-lg text-lg text-gray-400 md:text-xl">
          <Typewriter
            text="Type a topic. SlideX builds a complete, designed presentation — not an AI-looking one."
            delay={1.5}
            speed={25}
          />
        </div>

        {/* CTAs — staggered slide up with hover effects */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <motion.div
            whileHover={{ scale: 1.08, boxShadow: '0 0 30px rgba(0,71,224,0.4)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Link
              href="/generate"
              className="inline-block rounded-lg bg-brand-blue px-8 py-4 text-sm font-semibold text-white transition-colors hover:bg-brand-blue/90"
            >
              Get started free &rarr;
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <a
              href="#how-it-works"
              className="inline-block rounded-lg border border-white/20 px-8 py-4 text-sm font-medium text-white transition-colors hover:border-white/40"
            >
              See how it works
            </a>
          </motion.div>
        </motion.div>

        {/* Trust text — fade in late */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="mt-12 text-sm text-gray-500"
        >
          Free &middot; No credit card &middot; 5 decks/month
        </motion.p>
      </div>
    </section>
  )
}
