'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-white/10 bg-dark/80 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.05 }}>
          <Link href="/" className="text-xl font-bold text-white">
            SlideX
          </Link>
        </motion.div>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {[
            { label: 'Features', href: '#features' },
            { label: 'How it works', href: '#how-it-works' },
            { label: 'Pricing', href: '#pricing' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
            >
              <a
                href={item.href}
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            </motion.div>
          ))}
          <div className="h-4 w-px bg-white/10" />
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link
              href="/dashboard"
              className="text-sm text-gray-300 transition-colors hover:text-white"
            >
              Sign in
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href="/dashboard"
              className="rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/25 transition-all hover:bg-brand-blue/90 hover:shadow-xl hover:shadow-brand-blue/30"
            >
              Get started free
            </Link>
          </motion.div>
        </div>

        {/* Mobile hamburger */}
        <motion.button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-300 md:hidden"
          aria-label="Toggle menu"
          whileTap={{ scale: 0.9, rotate: 90 }}
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </motion.button>
      </div>

      {/* Mobile menu — animated */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-white/10 md:hidden"
          >
            <motion.div
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              className="flex flex-col gap-4 px-6 py-4"
            >
              {[
                { label: 'Features', href: '#features' },
                { label: 'How it works', href: '#how-it-works' },
                { label: 'Pricing', href: '#pricing' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="h-px bg-white/10" />
              <Link
                href="/dashboard"
                className="text-sm text-gray-300 transition-colors hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg bg-brand-blue px-5 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-blue/90"
                onClick={() => setMobileOpen(false)}
              >
                Get started free
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
