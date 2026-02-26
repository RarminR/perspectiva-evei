'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  price: number
  installmentPrice: number | null
  maxParticipants: number
  accessDurationDays: number
}

export function CourseEditForm({ course }: { course: Course }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      price: Number(formData.get('price')),
      installmentPrice: formData.get('installmentPrice') ? Number(formData.get('installmentPrice')) : null,
      maxParticipants: Number(formData.get('maxParticipants')),
      accessDurationDays: Number(formData.get('accessDurationDays')),
    }

    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Eroare la salvare')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la salvare')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titlu
          </label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue={course.title}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            defaultValue={course.slug}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Preț (EUR)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            defaultValue={course.price}
            step="0.01"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label htmlFor="installmentPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Preț rate (EUR)
          </label>
          <input
            type="number"
            id="installmentPrice"
            name="installmentPrice"
            defaultValue={course.installmentPrice ?? ''}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">
            Locuri maxime
          </label>
          <input
            type="number"
            id="maxParticipants"
            name="maxParticipants"
            defaultValue={course.maxParticipants}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label htmlFor="accessDurationDays" className="block text-sm font-medium text-gray-700 mb-1">
            Zile acces
          </label>
          <input
            type="number"
            id="accessDurationDays"
            name="accessDurationDays"
            defaultValue={course.accessDurationDays}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descriere
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={course.description ?? ''}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent text-sm"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-[#2D1B69] text-white rounded-lg hover:bg-[#2D1B69]/90 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Se salvează...' : 'Salvează'}
        </button>
      </div>
    </form>
  )
}
