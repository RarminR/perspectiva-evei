'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Guide {
  id: string
  title: string
  price: number
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function EditBundlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guides, setGuides] = useState<Guide[]>([])
  const [selectedGuideIds, setSelectedGuideIds] = useState<string[]>([])
  const [form, setForm] = useState({
    title: '',
    price: '',
    originalPrice: '',
    active: true,
  })

  useEffect(() => {
    async function load() {
      const { id } = await params
      try {
        const [bundleRes, guidesRes] = await Promise.all([
          fetch(`/api/admin/bundles/${id}`),
          fetch('/api/admin/guides'),
        ])

        const bundle = await bundleRes.json()
        const guidesData = await guidesRes.json()

        setForm({
          title: bundle.title || '',
          price: String(bundle.price ?? ''),
          originalPrice: String(bundle.originalPrice ?? ''),
          active: bundle.active ?? true,
        })

        setSelectedGuideIds(
          (bundle.items || []).map((item: { guide: { id: string } }) => item.guide.id)
        )
        setGuides(Array.isArray(guidesData) ? guidesData : guidesData.guides || [])
      } catch {
        setError('Eroare la incarcarea bundle-ului')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params])

  function handleChange(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleGuide(guideId: string) {
    setSelectedGuideIds((prev) => {
      const next = prev.includes(guideId)
        ? prev.filter((id) => id !== guideId)
        : [...prev, guideId]
      const total = guides
        .filter((g) => next.includes(g.id))
        .reduce((sum, g) => sum + g.price, 0)
      setForm((f) => ({ ...f, originalPrice: total.toFixed(2) }))
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const { id } = await params
      const res = await fetch(`/api/admin/bundles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          slug: slugify(form.title.trim()),
          price: parseFloat(form.price),
          originalPrice: parseFloat(form.originalPrice),
          active: form.active,
          guideIds: selectedGuideIds,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la salvare')
      }

      router.push('/admin/bundle-uri')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Eroare la salvare')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Esti sigur ca vrei sa stergi acest bundle?')) return

    try {
      const { id } = await params
      const res = await fetch(`/api/admin/bundles/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la stergere')
      }
      router.push('/admin/bundle-uri')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Eroare la stergere')
    }
  }

  if (loading) {
    return <p className="text-gray-500">Se incarca...</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Editeaza bundle</h1>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition"
        >
          Sterge
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titlu
          </label>
          <input
            id="title"
            type="text"
            required
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Pret Bundle (EUR)
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => handleChange('price', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Pret Original (EUR)
          </label>
          <input
            id="originalPrice"
            type="number"
            step="0.01"
            required
            value={form.originalPrice}
            onChange={(e) => handleChange('originalPrice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
          />
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ghiduri incluse
          </label>
          {guides.length === 0 ? (
            <p className="text-sm text-gray-400">Nu exista ghiduri.</p>
          ) : (
            <div className="space-y-2 rounded-lg border border-gray-200 p-3">
              {guides.map((guide) => (
                <label
                  key={guide.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedGuideIds.includes(guide.id)}
                    onChange={() => toggleGuide(guide.id)}
                    className="h-4 w-4 rounded border-gray-300 text-[#a007dc] focus:ring-[#a007dc]"
                  />
                  <span className="text-sm text-gray-900">{guide.title}</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {guide.price.toFixed(2)} EUR
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-[#a007dc] text-white rounded-lg text-sm font-medium hover:bg-[#d4177e] transition disabled:opacity-50"
          >
            {saving ? 'Se salveaza...' : 'Salveaza'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/bundle-uri')}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
          >
            Anuleaza
          </button>
        </div>
      </form>
    </div>
  )
}
