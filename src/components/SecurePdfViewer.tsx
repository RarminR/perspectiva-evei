'use client'

import { useCallback, useEffect, useState } from 'react'
import { Watermark } from './Watermark'

interface SecurePdfViewerProps {
  guideId: string
  userEmail: string
  userId: string
}

export function SecurePdfViewer({ guideId, userEmail, userId }: SecurePdfViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const watermarkText = `${userEmail} • ${userId.slice(0, 8)}`

  const fetchPdf = useCallback(async () => {
    try {
      const res = await fetch(`/api/guides/${guideId}/pdf`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la încărcarea PDF-ului')
      }
      const { url } = await res.json()
      setPdfUrl(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [guideId])

  useEffect(() => {
    fetchPdf()
  }, [fetchPdf])

  // Refresh signed URL every 4 minutes (expires in 5)
  useEffect(() => {
    const interval = setInterval(fetchPdf, 4 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchPdf])

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
    <div
      className="relative rounded-2xl bg-white shadow-lg overflow-hidden"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <Watermark text={watermarkText} />
      <iframe
        src={`${pdfUrl}#toolbar=0&navpanes=0`}
        className="relative z-0 w-full"
        style={{ height: 'calc(100vh - 200px)', minHeight: '600px', border: 'none' }}
        title="Ghid PDF"
      />
    </div>
  )
}
