'use client'

import { useState } from 'react'

export function InvoiceActions({
  invoiceId,
  status,
}: {
  invoiceId: string
  status: string
}) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleAction(action: 'retry' | 'storno') {
    const label = action === 'retry' ? 'reîncerca' : 'storna'
    if (!confirm(`Ești sigur că vrei să ${label} această factură?`)) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json()
        setResult(`Eroare: ${data.error || 'Eroare necunoscută'}`)
      } else {
        setResult(action === 'retry' ? 'Reîncercare inițiată.' : 'Stornare procesată.')
        window.location.reload()
      }
    } catch {
      setResult('Eroare de rețea.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex gap-3">
        {status === 'FAILED' && (
          <button
            onClick={() => handleAction('retry')}
            disabled={loading}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? 'Se procesează...' : 'Reîncearcă'}
          </button>
        )}
        {(status === 'CREATED' || status === 'FAILED') && (
          <button
            onClick={() => handleAction('storno')}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? 'Se procesează...' : 'Stornează'}
          </button>
        )}
      </div>
      {result && (
        <p className={`mt-2 text-sm ${result.startsWith('Eroare') ? 'text-red-600' : 'text-green-600'}`}>
          {result}
        </p>
      )}
    </div>
  )
}
