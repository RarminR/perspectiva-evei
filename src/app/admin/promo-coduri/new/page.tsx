'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPromoCodePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
  })

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/admin/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.toUpperCase().trim(),
          type: form.type,
          value: parseFloat(form.value),
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          validFrom: form.validFrom || null,
          validUntil: form.validUntil || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la salvare')
      }

      router.push('/admin/promo-coduri')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Cod Promoțional Nou</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Cod
          </label>
          <input
            id="code"
            type="text"
            required
            value={form.code}
            onChange={(e) => handleChange('code', e.target.value)}
            placeholder="ex: SAVE20"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent font-mono uppercase"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Tip Reducere
          </label>
          <select
            id="type"
            value={form.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
          >
            <option value="PERCENTAGE">Procent (%)</option>
            <option value="FIXED">Sumă fixă (EUR)</option>
          </select>
        </div>

        <div>
          <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
            Valoare {form.type === 'PERCENTAGE' ? '(%)' : '(EUR)'}
          </label>
          <input
            id="value"
            type="number"
            step="0.01"
            required
            value={form.value}
            onChange={(e) => handleChange('value', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700 mb-1">
            Utilizări maxime (opțional)
          </label>
          <input
            id="maxUses"
            type="number"
            value={form.maxUses}
            onChange={(e) => handleChange('maxUses', e.target.value)}
            placeholder="Nelimitat"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700 mb-1">
              Valabil de la (opțional)
            </label>
            <input
              id="validFrom"
              type="date"
              value={form.validFrom}
              onChange={(e) => handleChange('validFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 mb-1">
              Valabil până la (opțional)
            </label>
            <input
              id="validUntil"
              type="date"
              value={form.validUntil}
              onChange={(e) => handleChange('validUntil', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-[#E91E8C] text-white rounded-lg text-sm font-medium hover:bg-[#d4177e] transition disabled:opacity-50"
          >
            {saving ? 'Se salvează...' : 'Salvează'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/promo-coduri')}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
          >
            Anulează
          </button>
        </div>
      </form>
    </div>
  )
}
