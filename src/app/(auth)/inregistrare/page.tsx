"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const inputClasses =
  "w-full bg-white/[0.08] border border-white/[0.15] rounded-xl px-4 py-3 text-[#f8f9fa] placeholder:text-white/30 focus:outline-none focus:border-[#a007dc] focus:ring-2 focus:ring-[#a007dc]/25 transition-colors duration-200 text-sm"

export default function InregistrarePage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password.length < 8) {
      setError("Parola trebuie să aibă cel puțin 8 caractere")
      return
    }

    if (password !== confirmPassword) {
      setError("Parolele nu se potrivesc")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "A apărut o eroare")
        setLoading(false)
        return
      }

      router.push("/logare?registered=true")
    } catch {
      setError("A apărut o eroare de rețea")
      setLoading(false)
    }
  }

  return (
    <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.1] rounded-3xl p-8 sm:p-10 shadow-2xl shadow-purple-950/40">
      <div className="w-16 h-1 bg-gradient-to-r from-[#a007dc] to-[#d063f0] rounded-full mx-auto mb-8" />

      <p className="text-center text-[#f8f9fa]/40 text-xs font-semibold tracking-[0.2em] uppercase mb-6">
        Perspectiva Evei
      </p>

      <h1 className="text-[#f8f9fa] text-2xl font-bold text-center mb-2">
        Creează-ți contul
      </h1>
      <p className="text-[#f8f9fa]/60 text-sm text-center mb-8">
        Înregistrează-te pentru a accesa cursurile și ghidurile.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-[#f8f9fa]/70 text-sm font-medium mb-1.5">
            Nume complet
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={inputClasses}
            placeholder="Numele tău complet"
          />
        </div>

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

        <div>
          <label htmlFor="password" className="block text-[#f8f9fa]/70 text-sm font-medium mb-1.5">
            Parolă
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
          <label htmlFor="confirmPassword" className="block text-[#f8f9fa]/70 text-sm font-medium mb-1.5">
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
          {loading ? "Se creează contul..." : "Creează cont"}
        </button>
      </form>

      <div className="h-px bg-white/[0.1] my-6" />

      <div className="text-center text-sm">
        <p className="text-[#f8f9fa]/50">
          Ai deja un cont?{" "}
          <Link href="/logare" className="text-[#f8f9fa]/80 underline hover:text-[#f8f9fa] transition-colors">
            Loghează-te
          </Link>
        </p>
      </div>
    </div>
  )
}
