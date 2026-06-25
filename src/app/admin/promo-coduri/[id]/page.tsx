'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PromoProduct {
  type: 'COURSE' | 'GUIDE' | 'BUNDLE'
  id: string
  title: string
  price: number
}

function productKey(p: { type: string; id: string }) {
  return `${p.type}:${p.id}`
}

export default function EditPromoCodePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [products, setProducts] = useState<PromoProduct[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
    active: true,
  })

  useEffect(() => {
    async function load() {
      const { id } = await params
      try {
        const [promoRes, productsRes] = await Promise.all([
          fetch(`/api/admin/promo/${id}`),
          fetch('/api/admin/promo/products'),
        ])

        if (!promoRes.ok) {
          throw new Error('Codul promoțional nu a fost găsit')
        }

        const promo = await promoRes.json()
        const productsData = await productsRes.json()

        setForm({
          code: promo.code || '',
          type: promo.type || 'PERCENTAGE',
          value: String(promo.value ?? ''),
          maxUses: promo.maxUses != null ? String(promo.maxUses) : '',
          validFrom: promo.validFrom ? String(promo.validFrom).slice(0, 10) : '',
          validUntil: promo.validUntil ? String(promo.validUntil).slice(0, 10) : '',
          active: promo.active ?? true,
        })

        if (Array.isArray(promo.appliesTo)) {
          setSelectedKeys(
            new Set(
              promo.appliesTo
                .filter(
                  (e: unknown): e is { type: string; id: string } =>
                    !!e &&
                    typeof e === 'object' &&
                    typeof (e as any).type === 'string' &&
                    typeof (e as any).id === 'string'
                )
                .map((e: { type: string; id: string }) => `${e.type}:${e.id}`)
            )
          )
        }

        if (Array.isArray(productsData.products)) setProducts(productsData.products)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Eroare la încărcare')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params])

  function handleChange(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleProduct(p: PromoProduct) {
    const key = productKey(p)
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const { id } = await params
      const appliesTo = products
        .filter((p) => selectedKeys.has(productKey(p)))
        .map((p) => ({ type: p.type, id: p.id }))

      const res = await fetch(`/api/admin/promo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.toUpperCase().trim(),
          type: form.type,
          value: parseFloat(form.value),
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
          validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
          active: form.active,
          appliesTo,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Eroare la salvare')
      }

      router.push('/admin/promo-coduri')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Ești sigur că vrei să ștergi acest cod promoțional?')) return
    setError('')
    try {
      const { id } = await params
      const res = await fetch(`/api/admin/promo/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Eroare la ștergere')
      }
      router.push('/admin/promo-coduri')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const productsByType = {
    COURSE: products.filter((p) => p.type === 'COURSE'),
    GUIDE: products.filter((p) => p.type === 'GUIDE'),
    BUNDLE: products.filter((p) => p.type === 'BUNDLE'),
  }

  if (loading) {
    return <p className="text-gray-500">Se încarcă...</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Editează Cod Promoțional</h1>
        <button
          type="button"
          onClick={handleDelete}
          className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition"
        >
          Șterge
        </button>
      </div>

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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent font-mono uppercase"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="active" className="text-sm font-medium text-gray-700">
            Activ
          </label>
          <button
            id="active"
            type="button"
            onClick={() => handleChange('active', !form.active)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.active ? 'bg-[#a007dc]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.active ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Se aplică pentru
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Bifează produsele pentru care e valabil codul. Dacă nu bifezi nimic, se aplică pentru orice produs.
          </p>

          {products.length === 0 ? (
            <p className="text-sm text-gray-500">Nu există produse active.</p>
          ) : (
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              {(['COURSE', 'GUIDE', 'BUNDLE'] as const).map((type) => {
                const list = productsByType[type]
                if (list.length === 0) return null
                const label = type === 'COURSE' ? 'Cursuri' : type === 'GUIDE' ? 'Ghiduri' : 'Bundle-uri'
                return (
                  <div key={type}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      {label}
                    </p>
                    <div className="space-y-1.5">
                      {list.map((p) => {
                        const key = productKey(p)
                        const checked = selectedKeys.has(key)
                        return (
                          <label
                            key={key}
                            className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProduct(p)}
                              className="w-4 h-4 text-[#a007dc] border-gray-300 rounded focus:ring-[#a007dc]"
                            />
                            <span>{p.title}</span>
                            <span className="text-gray-400 text-xs">€{p.price}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-[#a007dc] text-white rounded-lg text-sm font-medium hover:bg-[#d4177e] transition disabled:opacity-50"
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
