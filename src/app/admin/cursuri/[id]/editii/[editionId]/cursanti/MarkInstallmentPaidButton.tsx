'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function MarkInstallmentPaidButton({ order2Id }: { order2Id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    if (!confirm('Marchezi a doua rată ca plătită (transfer bancar / numerar)?')) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/orders/${order2Id}/mark-paid`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Eroare la marcare')
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
        className="text-xs px-2.5 py-1 rounded-md bg-[#a007dc] text-white hover:bg-[#51087e] transition disabled:opacity-50"
      >
        {busy ? 'Se marchează...' : 'Marchează rata 2 plătită'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
