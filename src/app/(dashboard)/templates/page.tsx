'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Search, Loader2 } from 'lucide-react'
import { TEMPLATES, TEMPLATE_CATEGORIES } from '@/lib/templates'
import { THEMES } from '@/lib/themes'
import { cn } from '@/lib/utils'
import TemplateCard from '@/components/templates/TemplateCard'

export default function TemplatesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [cloningId, setCloningId] = useState<string | null>(null)

  const filtered = TEMPLATES.filter((t) => {
    const matchesCategory = category === 'all' || t.category === category
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  async function handleUseTemplate(templateId: string) {
    if (cloningId) return
    setCloningId(templateId)
    try {
      const res = await fetch(`/api/templates/${templateId}/clone`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to create deck from template')
        return
      }
      const data = await res.json()
      toast.success('Deck created from template!')
      router.push(`/deck/${data.deckId}`)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setCloningId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">Explore Templates</h1>
        <p className="mt-1 text-sm text-grey">
          Professionally designed templates to help you get started quickly
        </p>
      </div>

      {/* Search + Filter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-dark outline-none transition-colors placeholder:text-grey/50 focus:border-brand-blue"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              category === cat.id
                ? 'border-brand-blue bg-brand-blue text-white'
                : 'border-gray-200 bg-white text-mid hover:border-brand-blue/30 hover:text-brand-blue',
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Template grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-mid">No templates found</p>
          <p className="mt-1 text-sm text-grey">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => {
            const theme = THEMES.find((th) => th.id === template.theme) ?? THEMES[0]!
            return (
              <TemplateCard
                key={template.id}
                template={template}
                theme={theme}
                isCloning={cloningId === template.id}
                onUse={() => handleUseTemplate(template.id)}
              />
            )
          })}
        </div>
      )}

      {/* Loading overlay for cloning */}
      {cloningId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex items-center gap-3 rounded-xl bg-white px-6 py-4 shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-brand-blue" />
            <span className="text-sm font-medium text-dark">Creating your deck...</span>
          </div>
        </div>
      )}
    </div>
  )
}
