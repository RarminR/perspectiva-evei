'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EnrollmentActionsProps {
  enrollmentId: string
  accessExpiresAt: string
  userName: string
}

export function EnrollmentActions({ enrollmentId, accessExpiresAt, userName }: EnrollmentActionsProps) {
  const router = useRouter()
  const [date, setDate] = useState(accessExpiresAt)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const changed = date !== accessExpiresAt

  async function handleSave() {
    if (!date) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessExpiresAt: date }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Eroare la salvare')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    if (!confirm(`Sigur scoți cursantul „${userName}" din această ediție? Acțiunea nu poate fi anulată.`)) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Eroare la ștergere')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare')
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={busy}
          className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-[#a007dc] focus:border-transparent disabled:opacity-50"
        />
        {changed && (
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !date}
            className="text-xs px-2.5 py-1 rounded-md bg-[#a007dc] text-white hover:bg-[#51087e] transition disabled:opacity-50"
          >
            {busy ? '...' : 'Salvează'}
          </button>
        )}
        <button
          type="button"
          onClick={handleRemove}
          disabled={busy}
          className="text-xs px-2.5 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
        >
          Scoate
        </button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
