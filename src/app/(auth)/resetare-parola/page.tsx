"use client"

import { useState } from "react"
import Link from "next/link"

const inputClasses =
  "w-full bg-white/[0.08] border border-white/[0.15] rounded-xl px-4 py-3 text-[#f8f9fa] placeholder:text-white/30 focus:outline-none focus:border-[#a007dc] focus:ring-2 focus:ring-[#a007dc]/25 transition-colors duration-200 text-sm"

export default function ResetareParolaPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "A apărut o eroare")
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      setError("A apărut o eroare de rețea")
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.1] rounded-3xl p-8 sm:p-10 shadow-2xl shadow-purple-950/40 text-center">
        <div className="w-16 h-1 bg-gradient-to-r from-[#a007dc] to-[#d063f0] rounded-full mx-auto mb-8" />

        <div className="text-5xl mb-4">📧</div>

        <h1 className="text-[#f8f9fa] text-2xl font-bold mb-3">
          Verifică email-ul
        </h1>
        <p className="text-[#f8f9fa]/60 text-sm leading-relaxed mb-6">
          Dacă adresa de email este asociată unui cont, vei primi un link de resetare a parolei.
        </p>

        <Link
          href="/logare"
          className="text-[#f8f9fa]/80 underline hover:text-[#f8f9fa] transition-colors text-sm"
        >
          Înapoi la logare
        </Link>
      </div>
    )
  }

  return (
    <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.1] rounded-3xl p-8 sm:p-10 shadow-2xl shadow-purple-950/40">
      <div className="w-16 h-1 bg-gradient-to-r from-[#a007dc] to-[#d063f0] rounded-full mx-auto mb-8" />

      <p className="text-center text-[#f8f9fa]/40 text-xs font-semibold tracking-[0.2em] uppercase mb-6">
        Perspectiva Evei
      </p>

      <h1 className="text-[#f8f9fa] text-2xl font-bold text-center mb-2">
        Resetare parolă
      </h1>
      <p className="text-[#f8f9fa]/60 text-sm text-center mb-8">
        Îți vom trimite un link pe email pentru resetare.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-[#f8f9fa]/70 text-sm font-medium mb-1.5">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClasses}
            placeholder="exemplu@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full bg-gradient-to-r from-[#a007dc] to-[#c23de6] text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#a007dc]/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? "Se trimite..." : "Trimite linkul de resetare"}
        </button>
      </form>

      <div className="h-px bg-white/[0.1] my-6" />

      <div className="text-center text-sm">
        <Link href="/logare" className="text-[#f8f9fa]/80 underline hover:text-[#f8f9fa] transition-colors">
          Înapoi la logare
        </Link>
      </div>
    </div>
  )
}
