'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    price: '',
    stock: '',
    images: '',
    active: true,
  })

  useEffect(() => {
    async function loadProduct() {
      const { id } = await params
      try {
        const res = await fetch(`/api/admin/products/${id}`)
        const data = await res.json()
        setForm({
          title: data.title || '',
          slug: data.slug || '',
          description: data.description || '',
          price: String(data.price || ''),
          stock: String(data.stock || ''),
          images: Array.isArray(data.images) ? data.images.join(', ') : '',
          active: data.active !== false,
        })
      } catch {
        setError('Eroare la încărcarea produsului')
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [params])

  function handleTitleChange(value: string) {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugify(value),
    }))
  }

  function handleChange(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const { id } = await params
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          images: form.images
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la salvare')
      }

      router.push('/admin/produse')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Ești sigur că vrei să ștergi acest produs?')) return

    try {
      const { id } = await params
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la ștergere')
      }
      router.push('/admin/produse')
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return <p className="text-gray-500">Se încarcă...</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Editează produs</h1>
        <button
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
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titlu
          </label>
          <input
            id="title"
            type="text"
            required
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
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
            Preț (EUR)
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
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
            Stoc
          </label>
          <input
            id="stock"
            type="number"
            required
            value={form.stock}
            onChange={(e) => handleChange('stock', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descriere
          </label>
          <textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
            Imagini (URL-uri separate prin virgulă)
          </label>
          <input
            id="images"
            type="text"
            value={form.images}
            onChange={(e) => handleChange('images', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="active"
            type="checkbox"
            checked={form.active}
            onChange={(e) => handleChange('active', e.target.checked)}
            className="w-4 h-4 text-[#E91E8C] border-gray-300 rounded focus:ring-[#E91E8C]"
          />
          <label htmlFor="active" className="text-sm font-medium text-gray-700">
            Activ
          </label>
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
            onClick={() => router.push('/admin/produse')}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
          >
            Anulează
          </button>
        </div>
      </form>
    </div>
  )
}
