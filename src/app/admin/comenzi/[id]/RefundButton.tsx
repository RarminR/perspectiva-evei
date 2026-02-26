'use client'

import { useState } from 'react'

export function RefundButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleRefund() {
    if (!confirm('Ești sigur că vrei să rambursezi această comandă?')) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refund' }),
      })
      if (!res.ok) {
        const data = await res.json()
        setResult(`Eroare: ${data.error || 'Eroare necunoscută'}`)
      } else {
        setResult('Rambursare procesată cu succes.')
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
      <button
        onClick={handleRefund}
        disabled={loading}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
      >
        {loading ? 'Se procesează...' : 'Rambursare'}
      </button>
      {result && (
        <p className={`mt-2 text-sm ${result.startsWith('Eroare') ? 'text-red-600' : 'text-green-600'}`}>
          {result}
        </p>
      )}
    </div>
  )
}
