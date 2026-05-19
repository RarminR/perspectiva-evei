'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

type User = {
  id: string
  name: string
  email: string
  role: string
  accountActivated: boolean
  onboardingEmailSentAt: string | null
  createdAt: string
  _count: { devices: number; orders: number }
}

type Filter = 'all' | 'onboarding_sent' | 'onboarding_not_sent' | 'activated' | 'not_activated'

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Toți',
  onboarding_sent: 'Mail trimis',
  onboarding_not_sent: 'Mail netrimis',
  activated: 'Cont activat',
  not_activated: 'Cont neactivat',
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr))
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filter === 'onboarding_sent') params.set('onboarding', 'sent')
    if (filter === 'onboarding_not_sent') params.set('onboarding', 'not_sent')
    if (filter === 'activated') params.set('activated', 'yes')
    if (filter === 'not_activated') params.set('activated', 'no')

    const res = await fetch(`/api/admin/users?${params}`)
    const data = await res.json() as { users: User[] }
    setUsers(data.users ?? [])
    setSelected(new Set())
    setLoading(false)
  }, [search, filter])

  useEffect(() => {
    const t = setTimeout(() => { void fetchUsers() }, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [fetchUsers, search])

  function toggleAll() {
    if (selected.size === users.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(users.map((u) => u.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function sendOnboarding() {
    if (selected.size === 0) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/users/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(selected) }),
      })
      const data = await res.json() as { sent: number; failed: string[] }
      setToast({ msg: `Trimis: ${data.sent}${data.failed.length ? `, eșuat: ${data.failed.join(', ')}` : ''}`, ok: data.failed.length === 0 })
      void fetchUsers()
    } catch {
      setToast({ msg: 'Eroare la trimitere.', ok: false })
    } finally {
      setSending(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white text-sm shadow-lg ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Utilizatori</h1>
        <Link href="/admin/utilizatori/new" className="px-4 py-2 bg-[#a007dc] text-white rounded-lg text-sm font-medium hover:bg-[#51087e] transition">
          Adaugă utilizator
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Caută după nume sau email..."
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#51087e] w-72"
        />
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === f ? 'bg-[#51087e] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg">
          <span className="text-sm text-purple-700 font-medium">{selected.size} selectat{selected.size !== 1 ? 'i' : ''}</span>
          <button
            onClick={() => void sendOnboarding()}
            disabled={sending}
            className="px-3 py-1.5 bg-[#a007dc] text-white text-xs font-medium rounded-lg hover:bg-[#51087e] transition disabled:opacity-50"
          >
            {sending ? 'Se trimite...' : 'Trimite mail onboarding'}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-gray-700">
            Deselectează
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400 text-sm">Se încarcă...</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">Niciun utilizator găsit.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.size === users.length && users.length > 0}
                      onChange={toggleAll}
                      className="accent-[#a007dc]"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Nume</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Cont activat</th>
                  <th className="px-4 py-3 font-medium">Mail onboarding</th>
                  <th className="px-4 py-3 font-medium">Comenzi</th>
                  <th className="px-4 py-3 font-medium">Înregistrat</th>
                  <th className="px-4 py-3 font-medium">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50 ${selected.has(user.id) ? 'bg-purple-50' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selected.has(user.id)}
                        onChange={() => toggleOne(user.id)}
                        className="accent-[#a007dc]"
                      />
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-4 text-gray-600">{user.email}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {user.accountActivated
                        ? <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">✓ Da</span>
                        : <span className="inline-flex items-center gap-1 text-gray-400 text-xs">— Nu</span>}
                    </td>
                    <td className="px-4 py-4">
                      {user.onboardingEmailSentAt
                        ? <span className="text-xs text-green-600 font-medium">✓ {formatDate(user.onboardingEmailSentAt)}</span>
                        : <span className="text-xs text-gray-400">— Netrimis</span>}
                    </td>
                    <td className="px-4 py-4 text-gray-600">{user._count.orders}</td>
                    <td className="px-4 py-4 text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/utilizatori/${user.id}`} className="text-[#51087e] hover:text-[#a007dc] font-medium text-sm">
                        Vezi
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
