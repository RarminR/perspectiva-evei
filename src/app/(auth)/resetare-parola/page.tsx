"use client"

import { useState } from "react"
import Link from "next/link"

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
      <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Verifică email-ul</h1>
        <p className="text-white/80 mb-6">
          Dacă adresa de email este asociată unui cont, vei primi un link de
          resetare a parolei.
        </p>
        <Link
          href="/logare"
          className="underline hover:text-white/80 text-sm"
        >
          Înapoi la logare
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
      <h1 className="text-2xl font-bold text-center mb-2">Resetare parolă</h1>
      <p className="text-white/60 text-center text-sm mb-6">
        Introdu adresa de email și îți vom trimite un link de resetare.
      </p>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder="exemplu@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 rounded-lg bg-white text-brand-purple-dark font-semibold hover:bg-white/90 transition disabled:opacity-50"
        >
          {loading ? "Se trimite..." : "Trimite link de resetare"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link href="/logare" className="underline hover:text-white/80">
          Înapoi la logare
        </Link>
      </div>
    </div>
  )
}
