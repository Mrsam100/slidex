'use client'

import { Plus, Sparkles, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'

interface SlideActionBarProps {
  onAddSlide: () => void
}

export default function SlideActionBar({ onAddSlide }: SlideActionBarProps) {
  return (
    <div className="group/bar flex items-center justify-center gap-2 py-3">
      <div className="h-px flex-1 bg-gray-200/60 transition-colors group-hover/bar:bg-gray-300/80" />
      <div className="flex items-center gap-0.5 rounded-full bg-white px-1 py-0.5 opacity-0 shadow-sm ring-1 ring-gray-200/60 transition-all group-hover/bar:opacity-100">
        <button
          onClick={onAddSlide}
          className="rounded-full p-2 text-grey transition-colors hover:bg-brand-blue/10 hover:text-brand-blue"
          aria-label="Add slide"
          title="Add slide"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => toast('AI slide generation coming soon')}
          className="rounded-full p-2 text-grey transition-colors hover:bg-brand-blue/10 hover:text-brand-blue"
          aria-label="AI generate"
          title="AI generate"
        >
          <Sparkles className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => toast('Layout options coming soon')}
          className="rounded-full p-2 text-grey transition-colors hover:bg-brand-blue/10 hover:text-brand-blue"
          aria-label="Change layout"
          title="Change layout"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="h-px flex-1 bg-gray-200/60 transition-colors group-hover/bar:bg-gray-300/80" />
    </div>
  )
}
