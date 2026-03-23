'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
}

export function AddStudentForm({
  editionId,
  users,
}: {
  editionId: string
  users: User[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [days, setDays] = useState('90')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!selectedUserId) return
    setSaving(true)
    setError('')

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + Number(days))

    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'course',
          resourceId: editionId,
          expiresAt: expiresAt.toISOString(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la adaugare')
      }

      setSelectedUserId('')
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Eroare la adaugare')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-[#51087e] text-white rounded-lg text-sm font-medium hover:bg-[#51087e]/90 transition"
        >
          + Adauga cursant
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#51087e]/20 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#51087e]">Adauga cursant</h3>
        <button
          onClick={() => { setOpen(false); setError('') }}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          &times;
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">{error}</div>
      )}

      {users.length === 0 ? (
        <p className="text-sm text-gray-400">Toti utilizatorii sunt deja inscrisi.</p>
      ) : (
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Utilizator</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#51087e]/30"
            >
              <option value="">Selecteaza...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Acces (zile)</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min={1}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#51087e]/30"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !selectedUserId}
            className="px-5 py-2 bg-[#51087e] text-white rounded-lg text-sm font-medium hover:bg-[#51087e]/90 disabled:opacity-50 transition"
          >
            {saving ? 'Se adauga...' : 'Adauga'}
          </button>
        </div>
      )}
    </div>
  )
}
