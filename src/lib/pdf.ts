import type { Slide, Theme } from '@/types/deck'

/**
 * Render slides to PDF using html2canvas + jsPDF.
 * Dynamically imports heavy libraries so they're only loaded when needed.
 */
export async function exportDeckToPDF(
  slides: Slide[],
  theme: Theme,
  deckTitle: string,
  onProgress: (current: number, total: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const [
    { default: jsPDF },
    { default: html2canvas },
    { createRoot },
    { createElement },
    { flushSync },
  ] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
    import('react-dom/client'),
    import('react'),
    import('react-dom'),
  ])

  // Dynamic import of SlideCanvas to avoid circular deps
  const { default: SlideCanvas } = await import(
    '@/components/slides/SlideCanvas'
  )

  // Ensure all fonts are loaded before capturing
  await document.fonts.ready

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1280, 720],
    compress: true,
  })

  for (let i = 0; i < slides.length; i++) {
    // Check for cancellation
    if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')

    const slide = slides[i]
    if (!slide) continue

    // Create offscreen container (visible to renderer but hidden from user)
    const container = document.createElement('div')
    container.style.cssText =
      'position:absolute;left:0;top:0;width:1280px;height:720px;overflow:hidden;z-index:-1;opacity:0;pointer-events:none;'
    document.body.appendChild(container)

    const root = createRoot(container)
    try {
      // Synchronous render to ensure DOM is ready before capture
      flushSync(() => {
        root.render(createElement(SlideCanvas, { slide, theme }))
      })

      // Wait for browser paint
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      )

      // Capture to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 1280,
        height: 720,
        backgroundColor: theme.bgColor,
      })

      // Add page (first page is auto-created)
      if (i > 0) pdf.addPage()
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.92),
        'JPEG',
        0,
        0,
        1280,
        720,
      )

      onProgress(i + 1, slides.length)
    } finally {
      // Always clean up, even on error
      root.unmount()
      if (container.parentNode) {
        document.body.removeChild(container)
      }
    }
  }

  // Save with sanitized filename
  const filename = deckTitle
    .replace(/[^a-z0-9\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 100)
  pdf.save(`${filename || 'slidex-deck'}.pdf`)
}
