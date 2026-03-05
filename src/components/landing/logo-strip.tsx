'use client'

import { FadeUp, motion } from './motion'

/* Each logo = unique SVG icon + "Logoipsum" text — white/bright, bigger */
function Logo1() {
  return (
    <div className="flex shrink-0 items-center gap-3 px-12">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="whitespace-nowrap text-lg font-semibold text-white/70">Logoipsum</span>
    </div>
  )
}

function Logo2() {
  return (
    <div className="flex shrink-0 items-center gap-3 px-12">
      <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
        <rect x="2" y="2" width="24" height="24" rx="6" stroke="white" strokeWidth="1.5"/>
        <circle cx="10" cy="12" r="2.5" fill="white"/>
        <circle cx="18" cy="12" r="2.5" fill="white"/>
        <path d="M10 18c0 0 2 2 4 2s4-2 4-2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span className="whitespace-nowrap text-xl font-bold text-white">Logoipsum</span>
    </div>
  )
}

function Logo3() {
  return (
    <div className="flex shrink-0 items-center gap-3 px-12">
      <svg width="40" height="32" viewBox="0 0 30 24" fill="none">
        <rect x="1" y="1" width="28" height="22" rx="8" fill="#ccc"/>
        <circle cx="11" cy="12" r="3" fill="#0A0A0A"/>
        <circle cx="19" cy="12" r="3" fill="#0A0A0A"/>
      </svg>
      <span className="whitespace-nowrap text-lg font-semibold text-white/70">Logoipsum</span>
    </div>
  )
}

function Logo4() {
  return (
    <div className="flex shrink-0 items-center gap-3 px-12">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6l3-6z" fill="#bbb"/>
      </svg>
      <span className="whitespace-nowrap text-lg font-medium text-white/60">Logoipsum</span>
    </div>
  )
}

function Logo5() {
  return (
    <div className="flex shrink-0 items-center gap-3 px-12">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#ddd" strokeWidth="1.5"/>
        <path d="M8 12l3 3 5-5" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="whitespace-nowrap text-lg font-semibold text-white/70">Logoipsum</span>
    </div>
  )
}

function Logo6() {
  return (
    <div className="flex shrink-0 items-center gap-3 px-12">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" fill="white" fillOpacity="0.5" stroke="white" strokeOpacity="0.7" strokeWidth="1"/>
      </svg>
      <span className="whitespace-nowrap text-xl font-bold text-white/80">Logoipsum</span>
    </div>
  )
}

function Logo7() {
  return (
    <div className="flex shrink-0 items-center gap-3 px-12">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" stroke="#ddd" strokeWidth="1.5" fill="none"/>
        <polygon points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5" fill="#ddd" fillOpacity="0.3"/>
      </svg>
      <span className="whitespace-nowrap text-lg font-medium text-white/60">Logoipsum</span>
    </div>
  )
}

function Logo8() {
  return (
    <div className="flex shrink-0 items-center gap-3 px-12">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#ddd" strokeWidth="1.5"/>
        <path d="M12 6v6l4 2" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span className="whitespace-nowrap text-lg font-semibold text-white/70">Logoipsum</span>
    </div>
  )
}

const logoComponents = [Logo1, Logo2, Logo3, Logo4, Logo5, Logo6, Logo7, Logo8]

export function LogoStrip() {
  const allLogos = [...logoComponents, ...logoComponents]

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
          Over 50+ business trust us
        </motion.p>
      </FadeUp>

      {/* Infinite scrolling logo marquee */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-dark to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-dark to-transparent" />

        <div className="logo-marquee flex w-max items-center hover:[animation-play-state:paused]">
          {allLogos.map((LogoComp, i) => (
            <LogoComp key={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
