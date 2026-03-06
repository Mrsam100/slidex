'use client'

import { FadeUp, motion } from './motion'

/* Each logo = unique SVG icon + "Logoipsum" text — white/bright, bigger */
function LogoItem({ name }: { name: string }) {
  return (
    <div className="flex shrink-0 items-center px-12">
      <span className="whitespace-nowrap text-lg font-semibold text-white/40">{name}</span>
    </div>
  )
}

const LOGO_NAMES = ['Stanford', 'MIT OpenCourseWare', 'Coursera', 'Khan Academy', 'Notion', 'Canva', 'Figma', 'Linear']

export function LogoStrip() {
  const allNames = [...LOGO_NAMES, ...LOGO_NAMES]

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
          Trusted by 50+ businesses worldwide
        </motion.p>
      </FadeUp>

      {/* Infinite scrolling logo marquee */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-dark to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-dark to-transparent" />

        <div className="logo-marquee flex w-max items-center hover:[animation-play-state:paused]">
          {allNames.map((name, i) => (
            <LogoItem key={`${name}-${i}`} name={name} />
          ))}
        </div>
      </div>
    </section>
  )
}
