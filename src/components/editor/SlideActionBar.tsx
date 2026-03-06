'use client'

import { Plus } from 'lucide-react'

interface SlideActionBarProps {
  onAddSlide: () => void
}

export default function SlideActionBar({ onAddSlide }: SlideActionBarProps) {
  return (
    <div className="group/bar flex items-center justify-center gap-2 py-3">
      <div className="h-px flex-1 bg-gray-200/60 transition-colors group-hover/bar:bg-gray-300/80" />
      <button
        onClick={onAddSlide}
        className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-grey opacity-0 shadow-sm ring-1 ring-gray-200/60 transition-all hover:bg-brand-blue/5 hover:text-brand-blue hover:ring-brand-blue/20 group-hover/bar:opacity-100"
        aria-label="Add slide"
      >
        <Plus className="h-3.5 w-3.5" />
        Add slide
      </button>
      <div className="h-px flex-1 bg-gray-200/60 transition-colors group-hover/bar:bg-gray-300/80" />
    </div>
  )
}
