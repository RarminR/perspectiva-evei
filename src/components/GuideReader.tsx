'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { Watermark } from './Watermark'

interface GuideContent {
  id: string
  title: string
  contentJson: unknown
}

interface GuideReaderProps {
  guide: GuideContent
  userEmail: string
  userId: string
}

function parseGuidePages(contentJson: unknown): string[] {
  if (!contentJson) {
    return ['Continut indisponibil.']
  }

  if (typeof contentJson === 'string') {
    return [contentJson]
  }

  if (typeof contentJson === 'object' && contentJson !== null) {
    const content = contentJson as { pages?: unknown; text?: unknown }
    if (Array.isArray(content.pages) && content.pages.every((page) => typeof page === 'string')) {
      return content.pages
    }

    if (typeof content.text === 'string') {
      return [content.text]
    }

    return [JSON.stringify(contentJson)]
  }

  return ['Continut indisponibil.']
}

export function GuideReader({ guide, userEmail, userId }: GuideReaderProps) {
  const [currentPage, setCurrentPage] = useState(0)

  const pages = useMemo(() => parseGuidePages(guide.contentJson), [guide.contentJson])
  const watermarkText = `${userEmail} • ${userId.slice(0, 8)}`

  const preventSelection = useCallback((event: Event) => {
    event.preventDefault()
  }, [])

  const preventContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault()
  }, [])

  useEffect(() => {
    document.addEventListener('selectstart', preventSelection)
    document.addEventListener('contextmenu', preventContextMenu)

    return () => {
      document.removeEventListener('selectstart', preventSelection)
      document.removeEventListener('contextmenu', preventContextMenu)
    }
  }, [preventContextMenu, preventSelection])

  useEffect(() => {
    if (currentPage > pages.length - 1) {
      setCurrentPage(0)
    }
  }, [currentPage, pages.length])

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-[#2D1B69]">{guide.title}</h1>

      <div
        className="relative min-h-[600px] rounded-2xl bg-white p-8 shadow-lg"
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        data-testid="guide-reader-content"
      >
        <Watermark text={watermarkText} />

        <div className="prose relative z-0 max-w-none prose-gray">
          <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{pages[currentPage]}</p>
        </div>
      </div>

      {pages.length > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
            disabled={currentPage === 0}
            className="rounded-lg bg-[#2D1B69] px-4 py-2 text-white transition hover:bg-[#2D1B69]/90 disabled:opacity-40"
          >
            ← Pagina anterioara
          </button>

          <span className="text-sm text-gray-500">
            Pagina {currentPage + 1} din {pages.length}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(pages.length - 1, page + 1))}
            disabled={currentPage === pages.length - 1}
            className="rounded-lg bg-[#2D1B69] px-4 py-2 text-white transition hover:bg-[#2D1B69]/90 disabled:opacity-40"
          >
            Pagina urmatoare →
          </button>
        </div>
      ) : null}
    </div>
  )
}
