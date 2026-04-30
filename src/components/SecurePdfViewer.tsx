'use client'

import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { Watermark } from './Watermark'

interface SecurePdfViewerProps {
  guideId: string
  userEmail: string
  userId: string
}

type RenderTask = { cancel: () => void; promise: Promise<void> }

const GAP_PX = 16
const SPREAD_BREAKPOINT = '(min-width: 1024px)'

async function renderToCanvas(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  availableWidth: number,
  availableHeight: number
): Promise<RenderTask | null> {
  const page = await pdf.getPage(pageNumber)
  const unscaled = page.getViewport({ scale: 1 })
  const widthScale = availableWidth / unscaled.width
  const heightScale = availableHeight / unscaled.height
  const scale = Math.min(widthScale, heightScale) || 1
  const viewport = page.getViewport({ scale })
  const dpr = window.devicePixelRatio || 1

  canvas.width = Math.floor(viewport.width * dpr)
  canvas.height = Math.floor(viewport.height * dpr)
  canvas.style.width = `${Math.floor(viewport.width)}px`
  canvas.style.height = `${Math.floor(viewport.height)}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  return page.render({ canvasContext: ctx, viewport, canvas } as any) as RenderTask
}

function clearCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) return
  canvas.width = 0
  canvas.height = 0
  canvas.style.width = '0px'
  canvas.style.height = '0px'
}

export function SecurePdfViewer({ guideId, userEmail, userId }: SecurePdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftCanvasRef = useRef<HTMLCanvasElement>(null)
  const rightCanvasRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const renderQueueRef = useRef<Promise<void>>(Promise.resolve())
  const activeLeftTaskRef = useRef<RenderTask | null>(null)
  const activeRightTaskRef = useRef<RenderTask | null>(null)
  const desiredPageRef = useRef<number>(1)
  const isSpreadRef = useRef<boolean>(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pageCount, setPageCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [rendering, setRendering] = useState(false)
  const [isSpread, setIsSpread] = useState(false)

  const watermarkText = `${userEmail} • ${userId.slice(0, 8)}`

  // Track desktop vs mobile via media query
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia(SPREAD_BREAKPOINT)
    const update = () => {
      setIsSpread(mq.matches)
      isSpreadRef.current = mq.matches
    }
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Cancel both active tasks (used when superseding a render or unmounting)
  function cancelActiveTasks() {
    if (activeLeftTaskRef.current) {
      try { activeLeftTaskRef.current.cancel() } catch {}
    }
    if (activeRightTaskRef.current) {
      try { activeRightTaskRef.current.cancel() } catch {}
    }
  }

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
      cancelActiveTasks()
      activeLeftTaskRef.current = null
      activeRightTaskRef.current = null
      pdfRef.current?.destroy()
      pdfRef.current = null
    }
  }, [guideId])

  // Single render driver. Queues render steps so the canvases are never in
  // use by two tasks at once. Reads desiredPageRef and isSpreadRef inside
  // each step so rapid changes collapse to the latest target.
  useEffect(() => {
    if (loading || pageCount === 0) return

    desiredPageRef.current = currentPage
    isSpreadRef.current = isSpread

    cancelActiveTasks()
    let stepCancelled = false

    renderQueueRef.current = renderQueueRef.current
      .catch(() => {})
      .then(async () => {
        if (stepCancelled) return
        const pdf = pdfRef.current
        const leftCanvas = leftCanvasRef.current
        const rightCanvas = rightCanvasRef.current
        const container = containerRef.current
        if (!pdf || !leftCanvas || !container) return

        const target = desiredPageRef.current
        const spread = isSpreadRef.current

        const containerWidth = container.clientWidth || 600
        const containerHeight = container.clientHeight || 800
        const perPageWidth = spread
          ? Math.max(0, (containerWidth - GAP_PX) / 2)
          : containerWidth

        setRendering(true)
        try {
          // Left page
          const leftTask = await renderToCanvas(pdf, target, leftCanvas, perPageWidth, containerHeight)
          if (!leftTask) return
          if (stepCancelled || pdfRef.current !== pdf) {
            try { leftTask.cancel() } catch {}
            return
          }
          activeLeftTaskRef.current = leftTask
          try {
            await leftTask.promise
          } catch (err: any) {
            if (err?.name !== 'RenderingCancelledException') throw err
          } finally {
            if (activeLeftTaskRef.current === leftTask) activeLeftTaskRef.current = null
          }

          // Right page (only on desktop, only if there's another page)
          if (spread && rightCanvas) {
            const rightPage = target + 1
            if (rightPage <= pdf.numPages) {
              if (stepCancelled || pdfRef.current !== pdf) return
              const rightTask = await renderToCanvas(pdf, rightPage, rightCanvas, perPageWidth, containerHeight)
              if (!rightTask) return
              if (stepCancelled || pdfRef.current !== pdf) {
                try { rightTask.cancel() } catch {}
                return
              }
              activeRightTaskRef.current = rightTask
              try {
                await rightTask.promise
              } catch (err: any) {
                if (err?.name !== 'RenderingCancelledException') throw err
              } finally {
                if (activeRightTaskRef.current === rightTask) activeRightTaskRef.current = null
              }
            } else {
              clearCanvas(rightCanvas)
            }
          } else if (rightCanvas) {
            clearCanvas(rightCanvas)
          }
        } catch (err: any) {
          if (err?.name !== 'RenderingCancelledException') {
            setError(err.message || 'Eroare la randarea paginii')
          }
        } finally {
          setRendering(false)
        }
      })

    return () => {
      stepCancelled = true
    }
  }, [currentPage, pageCount, loading, isSpread])

  // Re-render on container resize without changing the page
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => {
      if (loading || pageCount === 0) return
      cancelActiveTasks()
      // Trigger the main effect by toggling state would re-run too much;
      // simplest: enqueue a render step here that mirrors the main one.
      const target = desiredPageRef.current
      const spread = isSpreadRef.current
      renderQueueRef.current = renderQueueRef.current
        .catch(() => {})
        .then(async () => {
          const pdf = pdfRef.current
          const leftCanvas = leftCanvasRef.current
          const rightCanvas = rightCanvasRef.current
          const containerEl = containerRef.current
          if (!pdf || !leftCanvas || !containerEl) return
          if (target !== desiredPageRef.current || spread !== isSpreadRef.current) return

          const containerWidth = containerEl.clientWidth || 600
          const containerHeight = containerEl.clientHeight || 800
          const perPageWidth = spread
            ? Math.max(0, (containerWidth - GAP_PX) / 2)
            : containerWidth

          try {
            const leftTask = await renderToCanvas(pdf, target, leftCanvas, perPageWidth, containerHeight)
            if (!leftTask) return
            activeLeftTaskRef.current = leftTask
            try { await leftTask.promise } catch {}
            if (activeLeftTaskRef.current === leftTask) activeLeftTaskRef.current = null

            if (spread && rightCanvas) {
              const rightPage = target + 1
              if (rightPage <= pdf.numPages) {
                const rightTask = await renderToCanvas(pdf, rightPage, rightCanvas, perPageWidth, containerHeight)
                if (!rightTask) return
                activeRightTaskRef.current = rightTask
                try { await rightTask.promise } catch {}
                if (activeRightTaskRef.current === rightTask) activeRightTaskRef.current = null
              } else {
                clearCanvas(rightCanvas)
              }
            } else if (rightCanvas) {
              clearCanvas(rightCanvas)
            }
          } catch {}
        })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [loading, pageCount])

  // Keyboard navigation. Step by 2 in spread mode, by 1 otherwise.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const step = isSpread ? 2 : 1
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentPage((p) => Math.min(p + step, pageCount))
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage((p) => Math.max(p - step, 1))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [pageCount, isSpread])

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

  const step = isSpread ? 2 : 1
  const canPrev = currentPage > 1
  const lastVisible = isSpread ? Math.min(currentPage + 1, pageCount) : currentPage
  const canNext = lastVisible < pageCount

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
            gap: isSpread ? `${GAP_PX}px` : 0,
          }}
        >
          <Watermark text={watermarkText} />
          <canvas ref={leftCanvasRef} className="relative z-0 block" />
          <canvas
            ref={rightCanvasRef}
            className="relative z-0 block"
            style={{ display: isSpread ? 'block' : 'none' }}
          />
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
              onClick={() => setCurrentPage((p) => Math.max(p - step, 1))}
              disabled={!canPrev}
              className="rounded-full bg-[#a007dc] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#51087e] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Pagina anterioară"
            >
              ← Anterior
            </button>
            <span className="rounded-full bg-black/70 px-4 py-1.5 text-sm font-medium text-white">
              {isSpread && lastVisible !== currentPage
                ? `${currentPage}-${lastVisible} / ${pageCount}`
                : `${currentPage} / ${pageCount}`}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + step, pageCount))}
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
