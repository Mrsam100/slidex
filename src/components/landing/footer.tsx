'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="border-t border-white/10 bg-dark px-6 py-12"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }}>
            <Link href="/" className="text-lg font-bold text-white">
              SlideX
            </Link>
          </motion.div>
          <span className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} SlideX AI
          </span>
        </div>

        <div className="flex gap-6">
          {[
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Contact', href: 'mailto:hello@slidex.ai' },
          ].map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Link
                href={item.href}
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.footer>
  )
}
