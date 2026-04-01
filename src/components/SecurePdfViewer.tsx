'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Watermark } from './Watermark'

interface SecurePdfViewerProps {
  guideId: string
  userEmail: string
  userId: string
}

export function SecurePdfViewer({ guideId, userEmail, userId }: SecurePdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pageCount, setPageCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const watermarkText = `${userEmail} • ${userId.slice(0, 8)}`

  const renderPdf = useCallback(async () => {
    try {
      const res = await fetch(`/api/guides/${guideId}/pdf`)
      if (!res.ok) {
        let msg = 'Eroare la încărcarea PDF-ului'
        try {
          const data = await res.json()
          msg = data.error || msg
        } catch {}
        throw new Error(msg)
      }

      const arrayBuffer = await res.arrayBuffer()

      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      setPageCount(pdf.numPages)

      const container = containerRef.current
      if (!container) return

      // Clear previous renders
      container.innerHTML = ''

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const containerWidth = container.clientWidth
        const unscaledViewport = page.getViewport({ scale: 1 })
        const scale = containerWidth / unscaledViewport.width
        const viewport = page.getViewport({ scale })

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width * window.devicePixelRatio
        canvas.height = viewport.height * window.devicePixelRatio
        canvas.style.width = '100%'
        canvas.style.height = 'auto'
        canvas.style.display = 'block'
        canvas.dataset.page = String(i)

        container.appendChild(canvas)

        const ctx = canvas.getContext('2d')!
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [guideId])

  useEffect(() => {
    renderPdf()
  }, [renderPdf])

  // Track current page on scroll
  useEffect(() => {
    const scrollContainer = containerRef.current?.parentElement
    if (!scrollContainer || pageCount === 0) return

    function handleScroll() {
      const container = containerRef.current
      const parent = container?.parentElement
      if (!container || !parent) return

      const scrollTop = parent.scrollTop
      const canvases = container.querySelectorAll('canvas')
      let page = 1

      for (const canvas of canvases) {
        if (canvas.offsetTop <= scrollTop + 100) {
          page = Number(canvas.dataset.page) || 1
        } else {
          break
        }
      }
      setCurrentPage(page)
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [pageCount])

  // Prevent right-click and text selection
  useEffect(() => {
    const preventContext = (e: MouseEvent) => e.preventDefault()
    const preventSelect = (e: Event) => e.preventDefault()

    document.addEventListener('contextmenu', preventContext)
    document.addEventListener('selectstart', preventSelect)

    return () => {
      document.removeEventListener('contextmenu', preventContext)
      document.removeEventListener('selectstart', preventSelect)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#a007dc] border-t-transparent" />
        <span className="ml-3 text-gray-600">Se încarcă ghidul...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Page indicator */}
      {pageCount > 1 && (
        <div className="sticky top-0 z-20 flex justify-center py-2">
          <span className="rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
            {currentPage} / {pageCount}
          </span>
        </div>
      )}

      <div
        className="relative mx-auto max-w-full overflow-y-auto rounded-2xl bg-white shadow-lg"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          maxHeight: 'calc(100vh - 220px)',
        }}
      >
        <Watermark text={watermarkText} />
        <div ref={containerRef} className="relative z-0" />
      </div>
    </div>
  )
}
