'use client'

import { Plus, Sparkles, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'

interface SlideActionBarProps {
  onAddSlide: () => void
}

export default function SlideActionBar({ onAddSlide }: SlideActionBarProps) {
  return (
    <div className="group/bar flex items-center justify-center gap-1 py-2">
      <div className="h-px flex-1 bg-gray-200 transition-colors group-hover/bar:bg-gray-300" />
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/bar:opacity-100">
        <button
          onClick={onAddSlide}
          className="rounded-lg p-1.5 text-grey transition-colors hover:bg-white hover:text-brand-blue hover:shadow-sm"
          aria-label="Add slide"
          title="Add slide"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => toast('AI slide generation coming soon')}
          className="rounded-lg p-1.5 text-grey transition-colors hover:bg-white hover:text-brand-blue hover:shadow-sm"
          aria-label="AI generate"
          title="AI generate"
        >
          <Sparkles className="h-4 w-4" />
        </button>
        <button
          onClick={() => toast('Layout options coming soon')}
          className="rounded-lg p-1.5 text-grey transition-colors hover:bg-white hover:text-brand-blue hover:shadow-sm"
          aria-label="Change layout"
          title="Change layout"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>
      <div className="h-px flex-1 bg-gray-200 transition-colors group-hover/bar:bg-gray-300" />
    </div>
  )
}
