'use client'

import { Sparkles, FileText, Users, GraduationCap, Briefcase, Globe, BookOpen, Presentation } from 'lucide-react'
import { FadeUp, motion } from './motion'
import type { ReactNode } from 'react'

function StatItem({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex shrink-0 items-center gap-3 px-10">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-brand-blue">
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

const STATS = [
  { icon: <Presentation className="h-5 w-5" />, value: '10,000+', label: 'Decks created' },
  { icon: <Users className="h-5 w-5" />, value: '2,500+', label: 'Active users' },
  { icon: <GraduationCap className="h-5 w-5" />, value: '500+', label: 'Educators' },
  { icon: <Sparkles className="h-5 w-5" />, value: '5', label: 'Themes' },
  { icon: <FileText className="h-5 w-5" />, value: '50,000+', label: 'Slides generated' },
  { icon: <Globe className="h-5 w-5" />, value: '120+', label: 'Countries' },
  { icon: <Briefcase className="h-5 w-5" />, value: '800+', label: 'Professionals' },
  { icon: <BookOpen className="h-5 w-5" />, value: '4.9/5', label: 'User rating' },
]

export function LogoStrip() {
  const allStats = [...STATS, ...STATS]

  return (
    <section className="bg-dark py-14">
      <FadeUp className="mb-10 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-sm font-medium tracking-wide text-gray-500"
        >
          Trusted by thousands of educators and professionals
        </motion.p>
      </FadeUp>

      {/* Infinite scrolling stats marquee */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-dark to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-dark to-transparent" />

        <div className="logo-marquee flex w-max items-center hover:[animation-play-state:paused]">
          {allStats.map((stat, i) => (
            <StatItem key={`${stat.label}-${i}`} {...stat} />
          ))}
        </div>
      </div>
    </section>
  )
}
