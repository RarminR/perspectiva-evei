'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function NewBundlePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    slug: '',
    price: '',
    originalPrice: '',
  })

  function handleTitleChange(value: string) {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugify(value),
    }))
  }

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/admin/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          slug: form.slug.trim(),
          price: parseFloat(form.price),
          originalPrice: parseFloat(form.originalPrice),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la salvare')
      }

      router.push('/admin/bundle-uri')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Bundle Nou</h1>

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
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="ex: Pachet Complet"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug
          </label>
          <input
            id="slug"
            type="text"
            required
            value={form.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Preț Bundle (EUR)
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => handleChange('price', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Preț Original (EUR)
          </label>
          <input
            id="originalPrice"
            type="number"
            step="0.01"
            required
            value={form.originalPrice}
            onChange={(e) => handleChange('originalPrice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
          />
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
            onClick={() => router.push('/admin/bundle-uri')}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
          >
            Anulează
          </button>
        </div>
      </form>
    </div>
  )
}
