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

export default function NewCaseStudyPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    coverImage: '',
    testimonialQuote: '',
    clientName: '',
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
      const res = await fetch('/api/admin/case-studies', {
        method: 'POST',
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Studiu de caz nou</h1>

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
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Conținut
          </label>
          <textarea
            id="content"
            rows={12}
            value={form.content}
            onChange={(e) => handleChange('content', e.target.value)}
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
          <label htmlFor="testimonialQuote" className="block text-sm font-medium text-gray-700 mb-1">
            Testimonial
          </label>
          <textarea
            id="testimonialQuote"
            rows={3}
            value={form.testimonialQuote}
            onChange={(e) => handleChange('testimonialQuote', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
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
