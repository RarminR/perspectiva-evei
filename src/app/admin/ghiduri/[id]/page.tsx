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

export default function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: '',
    coverImage: '',
    audioKey: '',
    contentJson: '',
  })

  useEffect(() => {
    async function loadGuide() {
      const { id } = await params
      try {
        const res = await fetch(`/api/admin/guides/${id}`)
        const data = await res.json()
        setForm({
          title: data.title || '',
          slug: data.slug || '',
          description: data.description || '',
          shortDescription: data.shortDescription || '',
          price: String(data.price || ''),
          coverImage: data.coverImage || '',
          audioKey: data.audioKey || '',
          contentJson: data.contentJson ? JSON.stringify(data.contentJson, null, 2) : '',
        })
      } catch {
        setError('Eroare la încărcarea ghidului')
      } finally {
        setLoading(false)
      }
    }
    loadGuide()
  }, [params])

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
      const { id } = await params
      let contentJson = null
      if (form.contentJson.trim()) {
        try {
          contentJson = JSON.parse(form.contentJson)
        } catch {
          setError('Conținutul JSON nu este valid')
          setSaving(false)
          return
        }
      }

      const res = await fetch(`/api/admin/guides/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          contentJson,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la salvare')
      }

      router.push('/admin/ghiduri')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Ești sigur că vrei să ștergi acest ghid?')) return

    try {
      const { id } = await params
      const res = await fetch(`/api/admin/guides/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la ștergere')
      }
      router.push('/admin/ghiduri')
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
        <h1 className="text-2xl font-bold text-gray-900">Editează ghid</h1>
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
          <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Descriere scurtă
          </label>
          <input
            id="shortDescription"
            type="text"
            value={form.shortDescription}
            onChange={(e) => handleChange('shortDescription', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-1">
            Imagine copertă (URL)
          </label>
          <input
            id="coverImage"
            type="text"
            value={form.coverImage}
            onChange={(e) => handleChange('coverImage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="audioKey" className="block text-sm font-medium text-gray-700 mb-1">
            Cheie audio S3
          </label>
          <input
            id="audioKey"
            type="text"
            value={form.audioKey}
            onChange={(e) => handleChange('audioKey', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="contentJson" className="block text-sm font-medium text-gray-700 mb-1">
            Conținut (JSON)
          </label>
          <textarea
            id="contentJson"
            rows={8}
            placeholder='{"pages": [{"content": "text here..."}]}'
            value={form.contentJson}
            onChange={(e) => handleChange('contentJson', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
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
            onClick={() => router.push('/admin/ghiduri')}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
          >
            Anulează
          </button>
        </div>
      </form>
    </div>
  )
}
