'use client'

import { useEffect } from 'react'
import { Watermark } from './Watermark'

interface SecurePdfViewerProps {
  guideId: string
  userEmail: string
  userId: string
}

export function SecurePdfViewer({ guideId, userEmail, userId }: SecurePdfViewerProps) {
  const watermarkText = `${userEmail} • ${userId.slice(0, 8)}`

  // The API route now proxies the PDF directly (same-origin, no X-Frame-Options issues)
  const pdfSrc = `/api/guides/${guideId}/pdf#toolbar=0&navpanes=0`

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

  return (
    <div
      className="relative rounded-2xl bg-white shadow-lg overflow-hidden"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <Watermark text={watermarkText} />
      <iframe
        src={pdfSrc}
        className="relative z-0 w-full"
        style={{ height: 'calc(100vh - 200px)', minHeight: '600px', border: 'none' }}
        title="Ghid PDF"
      />
    </div>
  )
}
