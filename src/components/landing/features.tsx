'use client'

import { Sparkles, LayoutGrid, Share2 } from 'lucide-react'
import { FadeUp, SlideIn, MagneticCard, CursorSpotlight, motion } from './motion'

export function Features() {
  return (
    <section className="bg-dark px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <FadeUp className="mb-16 text-center">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300">
            Features
          </span>
          <h2 className="mt-6 text-4xl font-bold text-white md:text-5xl">
            Everything You Need to Create
            <br className="hidden md:block" /> Stunning Presentations
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-400">
            We design, generate, and export beautiful slide decks that help you
            present smarter, not harder.
          </p>
        </FadeUp>

        {/* Bento grid — Row 1 */}
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          {/* Card 1 — Large visual card */}
          <SlideIn from="left">
            <MagneticCard className="h-full">
              <CursorSpotlight className="h-full rounded-2xl">
                <div className="h-full rounded-2xl border border-white/10 bg-[#111] p-8 transition-colors hover:border-brand-blue/30">
                  <div className="mb-6 rounded-xl border border-white/10 bg-[#0A0A0A] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="text-xs font-medium text-white">
                        AI Slides
                      </div>
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="rounded bg-brand-blue/20 px-2 py-0.5 text-xs text-blue-300"
                      >
                        Generating
                      </motion.div>
                    </div>
                    <div className="space-y-2">
                      {[
                        'Introduction Slide',
                        'Key Benefits',
                        'Data Overview',
                        'Conclusion',
                      ].map((item, i) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                            className="h-2 w-2 rounded-full bg-brand-blue"
                          />
                          <span className="text-sm text-gray-300">{item}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </CursorSpotlight>
            </MagneticCard>
          </SlideIn>

          {/* Card 2 — Text card */}
          <SlideIn from="right">
            <MagneticCard className="h-full">
              <CursorSpotlight className="h-full rounded-2xl">
                <div className="flex h-full flex-col justify-center rounded-2xl border border-white/10 bg-[#111] p-8 transition-colors hover:border-brand-blue/30">
                  <span className="mb-4 inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                    AI-Powered
                  </span>
                  <h3 className="text-2xl font-bold text-white">
                    Generate complete decks from a single prompt
                  </h3>
                  <p className="mt-3 text-gray-400">
                    SlideX analyzes your topic, creates an intelligent outline, and
                    generates beautifully structured slides — all powered by AI.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <motion.span
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,71,224,0.15)' }}
                      transition={{ type: 'spring', stiffness: 400 }}
                      className="cursor-default rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-300"
                    >
                      <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
                      Smart Outlines
                    </motion.span>
                    <motion.span
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,71,224,0.15)' }}
                      transition={{ type: 'spring', stiffness: 400 }}
                      className="cursor-default rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-300"
                    >
                      5 Themes
                    </motion.span>
                  </div>
                </div>
              </CursorSpotlight>
            </MagneticCard>
          </SlideIn>
        </div>

        {/* Bento grid — Row 2 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 3 — Text card */}
          <SlideIn from="left" delay={0.1}>
            <MagneticCard className="h-full">
              <CursorSpotlight className="h-full rounded-2xl">
                <div className="flex h-full flex-col justify-center rounded-2xl border border-white/10 bg-[#111] p-8 transition-colors hover:border-brand-blue/30">
                  <span className="mb-4 inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                    Smart Layouts
                  </span>
                  <h3 className="text-2xl font-bold text-white">
                    Auto-picks the best layout for every slide
                  </h3>
                  <p className="mt-3 text-gray-400">
                    Bullets, two-column, quotes, title slides — SlideX automatically
                    selects the ideal layout based on your content.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <motion.span
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,71,224,0.15)' }}
                      transition={{ type: 'spring', stiffness: 400 }}
                      className="cursor-default rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-300"
                    >
                      <LayoutGrid className="mr-1.5 inline h-3.5 w-3.5" />
                      4 Layout Types
                    </motion.span>
                    <motion.span
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,71,224,0.15)' }}
                      transition={{ type: 'spring', stiffness: 400 }}
                      className="cursor-default rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-300"
                    >
                      AI Rewrite
                    </motion.span>
                  </div>
                </div>
              </CursorSpotlight>
            </MagneticCard>
          </SlideIn>

          {/* Card 4 — Visual card */}
          <SlideIn from="right" delay={0.1}>
            <MagneticCard className="h-full">
              <CursorSpotlight className="h-full rounded-2xl">
                <div className="h-full rounded-2xl border border-white/10 bg-[#111] p-8 transition-colors hover:border-brand-blue/30">
                  <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue/20"
                      >
                        <Share2 className="h-4 w-4 text-brand-teal" />
                      </motion.div>
                      <div className="text-sm font-medium text-white">
                        Export &amp; Share
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'Export as PDF', status: 'Ready' },
                        { label: 'Share public link', status: 'Active' },
                        { label: 'Speaker notes', status: 'Included' },
                      ].map((item, i) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                        >
                          <span className="text-sm text-gray-300">
                            {item.label}
                          </span>
                          <motion.span
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                            className="text-xs text-brand-teal"
                          >
                            {item.status}
                          </motion.span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </CursorSpotlight>
            </MagneticCard>
          </SlideIn>
        </div>
      </div>
    </section>
  )
}
