'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Edition {
  id: string
  editionNumber: number
  startDate: Date
  endDate: Date
  enrollmentOpen: boolean
  maxParticipants: number
}

function toDateInput(date: Date): string {
  return new Date(date).toISOString().split('T')[0]
}

export function EditionEditForm({ edition, courseId }: { edition: Edition; courseId: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      editionNumber: Number(formData.get('editionNumber')),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      maxParticipants: Number(formData.get('maxParticipants')),
      enrollmentOpen: formData.get('enrollmentOpen') === 'on',
    }

    try {
      const res = await fetch(`/api/admin/editions/${edition.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Eroare la salvare')
      }

      router.push(`/admin/cursuri/${courseId}/editii`)
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

      <div>
        <label htmlFor="editionNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Număr ediție
        </label>
        <input
          type="number"
          id="editionNumber"
          name="editionNumber"
          defaultValue={edition.editionNumber}
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
            defaultValue={toDateInput(edition.startDate)}
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
            defaultValue={toDateInput(edition.endDate)}
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
          defaultValue={edition.maxParticipants}
          min={1}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="enrollmentOpen"
          name="enrollmentOpen"
          defaultChecked={edition.enrollmentOpen}
          className="w-4 h-4 text-[#2D1B69] border-gray-300 rounded focus:ring-[#2D1B69]"
        />
        <label htmlFor="enrollmentOpen" className="text-sm font-medium text-gray-700">
          Înscriere deschisă
        </label>
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
