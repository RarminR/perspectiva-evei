'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const inputClasses =
  'w-full bg-white/[0.08] border border-white/[0.15] rounded-xl px-4 py-3 text-[#f8f9fa] placeholder:text-white/30 focus:outline-none focus:border-[#a007dc] focus:ring-2 focus:ring-[#a007dc]/25 transition-colors duration-200 text-sm'

export function InviteForm({ token, email }: { token: string; email: string }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password.length < 8) {
      setError('Parola trebuie să aibă cel puțin 8 caractere')
      return
    }
    if (password !== confirmPassword) {
      setError('Parolele nu se potrivesc')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/invitatie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'A apărut o eroare')
        setLoading(false)
        return
      }

      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        router.push('/logare?invited=true')
      } else {
        router.push('/profilul-meu')
      }
    } catch {
      setError('A apărut o eroare de rețea')
      setLoading(false)
    }
  }

  return (
    <>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-[#f8f9fa]/70 text-sm font-medium mb-1.5"
          >
            Parolă nouă
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClasses}
            placeholder="Minim 8 caractere"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-[#f8f9fa]/70 text-sm font-medium mb-1.5"
          >
            Confirmă parola
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClasses}
            placeholder="Repetă parola"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full bg-gradient-to-r from-[#a007dc] to-[#c23de6] text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#a007dc]/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? 'Se setează parola...' : 'Setează parola și intră în cont'}
        </button>
      </form>
    </>
  )
}
