'use client'

import { useState, FormEvent } from 'react'

interface ProfileFormProps {
  user: {
    id: string
    name: string
    email: string
    phone: string
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })

      if (res.ok) {
        setMessage('Profil actualizat cu succes.')
      } else {
        const data = await res.json()
        setMessage(data.error || 'Eroare la salvare.')
      }
    } catch {
      setMessage('Eroare de retea.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Parolele nu coincid.')
      return
    }
    setSavingPassword(true)
    setPasswordMessage('')

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok) {
        setPasswordMessage('Parola a fost schimbata.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        setPasswordMessage(data.error || 'Eroare la schimbarea parolei.')
      }
    } catch {
      setPasswordMessage('Eroare de retea.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile info form */}
      <form onSubmit={handleProfileSubmit} className="space-y-4">
        <div>
          <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">
            Nume
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={user.email}
            readOnly
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700 mb-1">
            Telefon
          </label>
          <input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent outline-none"
          />
        </div>

        {message && (
          <p className={`text-sm ${message.includes('succes') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-[#E91E8C] text-white font-medium rounded-lg hover:bg-[#D11A7D] transition-colors disabled:opacity-50"
        >
          {saving ? 'Se salveaza...' : 'Salveaza'}
        </button>
      </form>

      {/* Password change */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-[#2D1B69] mb-4">Schimba parola</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
              Parola curenta
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
              Parola noua
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirma parola noua
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent outline-none"
            />
          </div>

          {passwordMessage && (
            <p className={`text-sm ${passwordMessage.includes('schimbata') ? 'text-green-600' : 'text-red-600'}`}>
              {passwordMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={savingPassword}
            className="px-6 py-2 bg-[#2D1B69] text-white font-medium rounded-lg hover:bg-[#231456] transition-colors disabled:opacity-50"
          >
            {savingPassword ? 'Se schimba...' : 'Schimba parola'}
          </button>
        </form>
      </div>
    </div>
  )
}
