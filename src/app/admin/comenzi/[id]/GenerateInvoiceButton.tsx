'use client'

import { useState } from 'react'

export function GenerateInvoiceButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/invoice`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setResult(`Eroare: ${data.error || 'Eroare necunoscută'}`)
      } else {
        setResult('Factură generată.')
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
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 bg-[#a007dc] text-white rounded-lg hover:bg-[#51087e] disabled:opacity-50 text-sm font-medium"
      >
        {loading ? 'Se generează...' : 'Generează factură'}
      </button>
      {result && (
        <p
          className={`mt-2 text-sm ${
            result.startsWith('Eroare') ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {result}
        </p>
      )}
    </div>
  )
}
