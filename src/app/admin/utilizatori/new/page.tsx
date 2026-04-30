'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewUserPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', role: 'USER' as 'USER' | 'ADMIN' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409 && data.userId) {
          router.push(`/admin/utilizatori/${data.userId}`)
          return
        }
        throw new Error(data.error || 'Eroare la creare')
      }
      router.push(`/admin/utilizatori/${data.user.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/utilizatori"
          className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block"
        >
          ← Înapoi la utilizatori
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Adaugă utilizator</h1>
        <p className="text-sm text-gray-500 mt-2">
          Creează un cont fără parolă. Folosește butonul "Trimite invitație pe email" de pe profilul utilizatorului ca să-i trimiți link-ul de setare a parolei.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nume
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="ex: Sofia Calin"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Opțional — dacă-l lași gol, folosește prefixul email-ului.
          </p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="ex: nume@domeniu.ro"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Rol
          </label>
          <select
            id="role"
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as 'USER' | 'ADMIN' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-[#a007dc] text-white rounded-lg text-sm font-medium hover:bg-[#51087e] transition disabled:opacity-50"
          >
            {saving ? 'Se creează...' : 'Adaugă utilizator'}
          </button>
          <Link
            href="/admin/utilizatori"
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
          >
            Anulează
          </Link>
        </div>
      </form>
    </div>
  )
}
