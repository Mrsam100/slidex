'use client'

import Link from 'next/link'
import { FadeUp, motion } from './motion'
import { ArrowRight } from 'lucide-react'

export function BottomCTA() {
  return (
    <section className="relative overflow-hidden bg-dark px-6 py-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
        <div className="h-[400px] w-[600px] rounded-full bg-brand-blue/10 blur-[120px]" />
      </div>

      <FadeUp className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-bold text-white md:text-5xl">
          Ready to create your
          <br />
          <span className="text-brand-blue">first deck?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-gray-400">
          Join thousands of educators and professionals who create beautiful presentations in seconds.
        </p>
        <motion.div
          className="mt-10"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-brand-blue/30 transition-all hover:bg-brand-blue/90 hover:shadow-2xl hover:shadow-brand-blue/40"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
        <p className="mt-4 text-xs text-gray-500">
          No credit card required
        </p>
      </FadeUp>
    </section>
  )
}
