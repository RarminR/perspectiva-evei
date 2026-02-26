'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function NewEditionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      courseId: id,
      editionNumber: Number(formData.get('editionNumber')),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      maxParticipants: Number(formData.get('maxParticipants')),
    }

    try {
      const res = await fetch('/api/admin/editions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Eroare la creare')
      }

      router.push(`/admin/cursuri/${id}/editii`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la creare')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Link href={`/admin/cursuri/${id}/editii`} className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">
          ← Înapoi la ediții
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Ediție nouă</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="editionNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Număr ediție
            </label>
            <input
              type="number"
              id="editionNumber"
              name="editionNumber"
              min={1}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Data început
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Data sfârșit
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">
              Locuri maxime
            </label>
            <input
              type="number"
              id="maxParticipants"
              name="maxParticipants"
              defaultValue={15}
              min={1}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent text-sm"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href={`/admin/cursuri/${id}/editii`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Anulează
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#2D1B69] text-white rounded-lg hover:bg-[#2D1B69]/90 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Se creează...' : 'Creează ediție'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
