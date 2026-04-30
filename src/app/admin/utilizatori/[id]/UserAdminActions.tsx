'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function UserAdminActions({
  userId,
  currentRole,
}: {
  userId: string
  currentRole: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [emailWarning, setEmailWarning] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerateInvite(sendEmail: boolean) {
    setInviteError(null)
    setEmailSent(false)
    setEmailWarning(null)
    setCopied(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteError(data.error || 'A apărut o eroare')
        return
      }
      setInviteUrl(data.inviteUrl)
      if (sendEmail) {
        if (data.emailSent) setEmailSent(true)
        else if (data.emailError) setEmailWarning(`Linkul a fost generat, dar email-ul nu s-a putut trimite: ${data.emailError}`)
      }
    } catch {
      setInviteError('A apărut o eroare de rețea')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopyInvite() {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  async function handleToggleRole() {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    if (!confirm(`Sigur vrei să schimbi rolul în ${newRole}?`)) return

    setLoading(true)
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleGrantAccess(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const type = formData.get('type') as string
    const resourceId = formData.get('resourceId') as string
    const expiresAt = formData.get('expiresAt') as string

    if (!type || !resourceId) return

    setLoading(true)
    try {
      await fetch(`/api/admin/users/${userId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, resourceId, expiresAt: expiresAt || undefined }),
      })
      form.reset()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Acțiuni admin
      </h2>

      <div className="space-y-4">
        <button
          onClick={handleToggleRole}
          disabled={loading}
          className="px-4 py-2 bg-[#51087e] text-white rounded-lg hover:bg-[#51087e]/90 text-sm font-medium disabled:opacity-50"
        >
          Schimbă rol → {currentRole === 'ADMIN' ? 'USER' : 'ADMIN'}
        </button>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Invitație pe email
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Trimite-i utilizatoarei un email cu link-ul pentru setarea parolei.
            Linkul expiră în 30 de zile. Poți și să-l copiezi manual dacă preferi.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleGenerateInvite(true)}
              disabled={loading}
              className="px-4 py-2 bg-[#a007dc] text-white rounded-lg hover:bg-[#a007dc]/90 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Se trimite...' : 'Trimite invitație pe email'}
            </button>
            <button
              onClick={() => handleGenerateInvite(false)}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
            >
              Doar generează link (fără email)
            </button>
          </div>

          {inviteError && (
            <p className="mt-3 text-sm text-red-600">{inviteError}</p>
          )}

          {emailSent && (
            <p className="mt-3 text-sm text-green-700">
              ✓ Email-ul de invitație a fost trimis.
            </p>
          )}

          {emailWarning && (
            <p className="mt-3 text-sm text-amber-700">{emailWarning}</p>
          )}

          {inviteUrl && (
            <div className="mt-3 flex items-center gap-2">
              <input
                readOnly
                value={inviteUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono bg-gray-50"
              />
              <button
                onClick={handleCopyInvite}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                {copied ? 'Copiat ✓' : 'Copiază'}
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Acordă acces manual
          </h3>
          <form onSubmit={handleGrantAccess} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tip</label>
              <select
                name="type"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="course">Curs (ediție)</option>
                <option value="guide">Ghid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                ID resursă
              </label>
              <input
                name="resourceId"
                type="text"
                placeholder="ID ediție / ghid"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Expiră la (opțional)
              </label>
              <input
                name="expiresAt"
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#a007dc] text-white rounded-lg hover:bg-[#a007dc]/90 text-sm font-medium disabled:opacity-50"
            >
              Acordă acces
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
