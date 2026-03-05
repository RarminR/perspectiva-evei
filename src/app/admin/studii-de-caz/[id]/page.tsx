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

export default function EditCaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [published, setPublished] = useState(false)
  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    coverImage: '',
    testimonialQuote: '',
    clientName: '',
  })

  useEffect(() => {
    async function loadCaseStudy() {
      const { id } = await params
      try {
        const res = await fetch(`/api/admin/case-studies/${id}`)
        const data = await res.json()
        setForm({
          title: data.title || '',
          slug: data.slug || '',
          content: data.content || '',
          coverImage: data.coverImage || '',
          testimonialQuote: data.testimonialQuote || '',
          clientName: data.clientName || '',
        })
        setPublished(data.published || false)
      } catch {
        setError('Eroare la încărcarea studiului de caz')
      } finally {
        setLoading(false)
      }
    }
    loadCaseStudy()
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
      const res = await fetch(`/api/admin/case-studies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la salvare')
      }

      router.push('/admin/studii-de-caz')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePublishToggle() {
    try {
      const { id } = await params
      const action = published ? 'unpublish' : 'publish'
      const res = await fetch(`/api/admin/case-studies/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare')
      }

      setPublished(!published)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDelete() {
    if (!confirm('Ești sigur că vrei să ștergi acest studiu de caz?')) return

    try {
      const { id } = await params
      const res = await fetch(`/api/admin/case-studies/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la ștergere')
      }
      router.push('/admin/studii-de-caz')
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
        <h1 className="text-2xl font-bold text-gray-900">Editează studiu de caz</h1>
        <div className="flex gap-3">
          <button
            onClick={handlePublishToggle}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              published
                ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {published ? 'Depublică' : 'Publică'}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition"
          >
            Șterge
          </button>
        </div>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Conținut
          </label>
          <textarea
            id="content"
            rows={12}
            value={form.content}
            onChange={(e) => handleChange('content', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="testimonialQuote" className="block text-sm font-medium text-gray-700 mb-1">
            Testimonial
          </label>
          <textarea
            id="testimonialQuote"
            rows={3}
            value={form.testimonialQuote}
            onChange={(e) => handleChange('testimonialQuote', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
            Nume client
          </label>
          <input
            id="clientName"
            type="text"
            value={form.clientName}
            onChange={(e) => handleChange('clientName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
          />
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
            onClick={() => router.push('/admin/studii-de-caz')}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
          >
            Anulează
          </button>
        </div>
      </form>
    </div>
  )
}
