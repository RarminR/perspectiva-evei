'use client'

import { useCallback, useState } from 'react'

interface PdfDownloadListProps {
  lessonId: string
  pdfKeys: string[]
}

function fileNameFromKey(key: string): string {
  const parts = key.split('/')
  const fileName = parts[parts.length - 1]
  return fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
}

export function PdfDownloadList({ lessonId, pdfKeys }: PdfDownloadListProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleDownload = useCallback(async (key: string) => {
    setLoading(key)
    try {
      const res = await fetch(`/api/resources/download?lessonId=${lessonId}&key=${encodeURIComponent(key)}`)
      if (!res.ok) {
        setLoading(null)
        return
      }
      const { url } = await res.json()
      window.open(url, '_blank')
    } catch {}
    setLoading(null)
  }, [lessonId])

  if (!pdfKeys || pdfKeys.length === 0) return null

  return (
    <div style={{
      marginTop: '1.5rem',
      padding: '1.25rem',
      backgroundColor: 'rgba(160,7,220,0.08)',
      borderRadius: '16px',
      border: '1px solid rgba(160,7,220,0.15)',
    }}>
      <p style={{ color: 'white', fontWeight: 600, margin: '0 0 0.75rem', fontSize: '0.9rem' }}>
        Materiale ({pdfKeys.length})
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {pdfKeys.map((key) => (
          <button
            key={key}
            onClick={() => handleDownload(key)}
            disabled={loading === key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0.625rem 1rem',
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              color: 'white',
              cursor: loading === key ? 'wait' : 'pointer',
              fontSize: '0.85rem',
              textAlign: 'left',
              width: '100%',
              opacity: loading === key ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>📄</span>
            <span style={{ flex: 1 }}>{fileNameFromKey(key)}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
              {loading === key ? '...' : '↓'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
