'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { FadeUp, FadeScale } from './motion'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Great for getting started',
    features: [
      '5 decks per month',
      '1 theme (Minimal)',
      'PDF export (watermarked)',
      'Public share links',
    ],
    cta: 'Get started',
    href: '/generate',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$8',
    period: '/month',
    description: 'For power users and teams',
    features: [
      'Unlimited decks',
      'All 5 themes',
      'AI rewrite',
      'PDF export (no watermark)',
      'Priority generation',
    ],
    cta: 'Upgrade to Pro',
    href: '/settings',
    highlighted: true,
    badge: 'Most popular',
  },
  {
    name: 'Teams',
    price: 'Soon',
    period: '',
    description: 'For organizations',
    features: [
      'Everything in Pro',
      'Team workspace',
      'Shared templates',
      'Admin controls',
    ],
    cta: 'Join waitlist',
    href: '#',
    highlighted: false,
    disabled: true,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="bg-dark px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <FadeUp className="mb-16 text-center">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300">
            Pricing
          </span>
          <h2 className="mt-6 text-4xl font-bold text-white md:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Start free. Upgrade when you need more.
          </p>
        </FadeUp>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <FadeScale key={plan.name} delay={i * 0.1}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-8 transition-colors ${
                  plan.highlighted
                    ? 'border-brand-blue/50 bg-[#111] shadow-lg shadow-brand-blue/10'
                    : 'border-white/10 bg-[#111]'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-blue px-4 py-1 text-xs font-semibold text-white">
                    {plan.badge}
                  </span>
                )}

                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-400">{plan.description}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-gray-400">{plan.period}</span>
                  )}
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.disabled ? (
                  <button
                    disabled
                    className="mt-8 w-full rounded-lg border border-white/10 px-6 py-3 text-sm font-medium text-gray-500 transition-colors"
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Link
                    href={plan.href}
                    className={`mt-8 block w-full rounded-lg px-6 py-3 text-center text-sm font-semibold transition-colors ${
                      plan.highlighted
                        ? 'bg-brand-blue text-white hover:bg-brand-blue/90'
                        : 'border border-white/20 text-white hover:border-white/40'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            </FadeScale>
          ))}
        </div>
      </div>
    </section>
  )
}
