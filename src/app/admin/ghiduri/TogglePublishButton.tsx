'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TogglePublishButtonProps {
  guideId: string
  published: boolean
}

export function TogglePublishButton({ guideId, published }: TogglePublishButtonProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/guides/${guideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !published }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Eroare la actualizare')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={`text-xs px-2.5 py-1 rounded-md transition disabled:opacity-50 ${
          published
            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {busy ? '...' : published ? 'Ascunde' : 'Publică'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
