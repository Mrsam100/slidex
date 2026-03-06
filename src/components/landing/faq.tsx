'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FadeUp, CursorSpotlight, motion, AnimatePresence } from './motion'

const faqs = [
  {
    question: 'How does SlideX generate presentations?',
    answer:
      'SlideX uses AI to analyze your topic, generate a structured outline with optimal slide layouts, and then create full slide content including headlines, bullet points, and speaker notes — all in seconds.',
  },
  {
    question: 'Can I edit the generated slides?',
    answer:
      'Yes! SlideX includes an AI rewrite feature that lets you select any slide and give instructions to refine, expand, or rephrase the content. You can also edit text directly in the editor.',
  },
  {
    question: 'What export formats are available?',
    answer:
      'You can export your presentations as PDF files. You can also generate public share links so anyone can view your deck in the browser.',
  },
  {
    question: 'Is SlideX free to use?',
    answer:
      'Yes! The free plan gives you 5 decks per month with the Minimal theme, PDF export, and public share links — no credit card required. Upgrade to Pro for unlimited decks and all 5 themes.',
  },
  {
    question: 'Who is SlideX designed for?',
    answer:
      'SlideX is built primarily for students and educators who need to create polished presentations quickly. It also works great for professionals, business presenters, and anyone who wants beautiful slides without the design work.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="bg-[#0D0D0D] px-6 py-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <FadeUp className="mb-16 text-center">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300">
            FAQs
          </span>
          <h2 className="mt-6 text-4xl font-bold text-white md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Quick answers to common questions about SlideX.
          </p>
        </FadeUp>

        {/* Accordion items */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <CursorSpotlight>
                <div
                  className={cn(
                    'rounded-xl border bg-[#111] transition-colors',
                    openIndex === i
                      ? 'border-brand-blue/40'
                      : 'border-white/10 hover:border-white/20',
                  )}
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="text-sm font-medium text-white">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: openIndex === i ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openIndex === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-4 text-sm leading-relaxed text-gray-400">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CursorSpotlight>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
