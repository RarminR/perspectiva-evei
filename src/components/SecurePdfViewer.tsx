'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { Watermark } from './Watermark'

interface SecurePdfViewerProps {
  guideId: string
  userEmail: string
  userId: string
}

export function SecurePdfViewer({ guideId, userEmail, userId }: SecurePdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const renderTaskRef = useRef<{ cancel: () => void; promise: Promise<void> } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pageCount, setPageCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [rendering, setRendering] = useState(false)

  const watermarkText = `${userEmail} • ${userId.slice(0, 8)}`

  const renderPage = useCallback(async (pageNumber: number) => {
    const pdf = pdfRef.current
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!pdf || !canvas || !container) return

    if (renderTaskRef.current) {
      const previous = renderTaskRef.current
      renderTaskRef.current = null
      previous.cancel()
      try {
        await previous.promise
      } catch {
        // RenderingCancelledException is expected
      }
    }

    setRendering(true)
    try {
      const page = await pdf.getPage(pageNumber)
      const unscaledViewport = page.getViewport({ scale: 1 })

      const availableWidth = container.clientWidth || 600
      const availableHeight = container.clientHeight || 800
      const widthScale = availableWidth / unscaledViewport.width
      const heightScale = availableHeight / unscaledViewport.height
      const scale = Math.min(widthScale, heightScale)

      const viewport = page.getViewport({ scale })
      const dpr = window.devicePixelRatio || 1

      canvas.width = Math.floor(viewport.width * dpr)
      canvas.height = Math.floor(viewport.height * dpr)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`

      const ctx = canvas.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const task = page.render({ canvasContext: ctx, viewport, canvas } as any)
      renderTaskRef.current = task
      await task.promise
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        setError(err.message || 'Eroare la randarea paginii')
      }
    } finally {
      setRendering(false)
    }
  }, [])

  // Load the PDF document once
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

        pdfRef.current = pdf
        setPageCount(pdf.numPages)
        setLoading(false)
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }
      pdfRef.current?.destroy()
      pdfRef.current = null
    }
  }, [guideId])

  // Render whenever current page or layout changes
  useEffect(() => {
    if (loading || pageCount === 0) return
    renderPage(currentPage)
  }, [currentPage, pageCount, loading, renderPage])

  // Re-render on container resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => {
      if (!loading && pageCount > 0) renderPage(currentPage)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [loading, pageCount, currentPage, renderPage])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentPage((p) => Math.min(p + 1, pageCount))
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage((p) => Math.max(p - 1, 1))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
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

  const canPrev = currentPage > 1
  const canNext = currentPage < pageCount

  return (
    <div className="relative">
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#a007dc] border-t-transparent" />
          <span className="ml-3 text-gray-600">Se încarcă ghidul...</span>
        </div>
      )}

      <div style={{ display: loading ? 'none' : 'block' }}>
        <div
          ref={containerRef}
          className="relative mx-auto flex w-full items-center justify-center rounded-2xl bg-white shadow-lg overflow-hidden"
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            height: 'calc(100vh - 220px)',
            minHeight: 400,
          }}
        >
          <Watermark text={watermarkText} />
          <canvas ref={canvasRef} className="relative z-0 block" />
          {rendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/40">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#a007dc] border-t-transparent" />
            </div>
          )}
        </div>

        {pageCount > 0 && (
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={!canPrev}
              className="rounded-full bg-[#a007dc] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#51087e] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Pagina anterioară"
            >
              ← Anterior
            </button>
            <span className="rounded-full bg-black/70 px-4 py-1.5 text-sm font-medium text-white">
              {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, pageCount))}
              disabled={!canNext}
              className="rounded-full bg-[#a007dc] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#51087e] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Pagina următoare"
            >
              Următor →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
