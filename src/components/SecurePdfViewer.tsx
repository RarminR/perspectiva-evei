'use client'

import { useEffect, useRef, useState } from 'react'
import { Watermark } from './Watermark'

interface SecurePdfViewerProps {
  guideId: string
  userEmail: string
  userId: string
}

export function SecurePdfViewer({ guideId, userEmail, userId }: SecurePdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pageCount, setPageCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const watermarkText = `${userEmail} • ${userId.slice(0, 8)}`

  // Fetch and render PDF
  useEffect(() => {
    let cancelled = false

    async function load() {
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
        if (cancelled) return

        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        if (cancelled) return

        setPageCount(pdf.numPages)
        setLoading(false)

        // Wait for the container to be in the DOM and have layout
        await new Promise((r) => requestAnimationFrame(r))
        await new Promise((r) => requestAnimationFrame(r))

        const container = containerRef.current
        if (!container || cancelled) return

        const containerWidth = container.parentElement?.clientWidth || container.clientWidth || 600

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return
          const page = await pdf.getPage(i)
          const unscaledViewport = page.getViewport({ scale: 1 })
          const scale = containerWidth / unscaledViewport.width
          const viewport = page.getViewport({ scale })

          const dpr = window.devicePixelRatio || 1
          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(viewport.width * dpr)
          canvas.height = Math.floor(viewport.height * dpr)
          canvas.style.width = `${Math.floor(viewport.width)}px`
          canvas.style.maxWidth = '100%'
          canvas.style.height = 'auto'
          canvas.style.display = 'block'
          canvas.style.margin = '0 auto'
          canvas.dataset.page = String(i)

          container.appendChild(canvas)

          const ctx = canvas.getContext('2d')!
          ctx.scale(dpr, dpr)
          await page.render({
            canvasContext: ctx,
            viewport,
            canvas,
          } as any).promise
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [guideId])

  // Track current page on scroll
  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl || pageCount === 0) return

    function handleScroll() {
      const container = containerRef.current
      if (!container || !scrollEl) return

      const scrollTop = scrollEl.scrollTop
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

    scrollEl.addEventListener('scroll', handleScroll)
    return () => scrollEl.removeEventListener('scroll', handleScroll)
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

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#a007dc] border-t-transparent" />
          <span className="ml-3 text-gray-600">Se încarcă ghidul...</span>
        </div>
      )}

      <div
        ref={scrollRef}
        className="relative mx-auto w-full overflow-y-auto rounded-2xl bg-white shadow-lg"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          maxHeight: 'calc(100vh - 220px)',
          display: loading ? 'none' : 'block',
        }}
      >
        <Watermark text={watermarkText} />
        <div ref={containerRef} className="relative z-0" />
      </div>
    </div>
  )
}
