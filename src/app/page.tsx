import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { Benefits } from '@/components/landing/benefits'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Testimonials } from '@/components/landing/testimonials'
import { Pricing } from '@/components/landing/pricing'
import { FAQ } from '@/components/landing/faq'
import { LogoStrip } from '@/components/landing/logo-strip'
import { BottomCTA } from '@/components/landing/bottom-cta'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'SlideX AI — Beautiful Presentations in Seconds',
  description:
    'Type a topic. Get a complete, designed slide deck. Free to start.',
  openGraph: {
    title: 'SlideX AI — Beautiful Presentations in Seconds',
    description:
      'Type a topic. Get a complete, designed slide deck. Free to start.',
  },
}

export default function Home() {
  return (
    <div className="bg-dark">
      <Navbar />
      <Hero />
      <LogoStrip />
      <Features />
      <Benefits />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <BottomCTA />
      <Footer />
    </div>
  )
}
