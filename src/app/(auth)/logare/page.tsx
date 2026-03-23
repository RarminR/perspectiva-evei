"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

const inputClasses =
  "w-full bg-white/[0.08] border border-white/[0.15] rounded-xl px-4 py-3 text-[#f8f9fa] placeholder:text-white/30 focus:outline-none focus:border-[#a007dc] focus:ring-2 focus:ring-[#a007dc]/25 transition-colors duration-200 text-sm"

function LogareForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const registered = searchParams.get("registered")
  const reset = searchParams.get("reset")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    })

    if (result?.error) {
      setError("Email sau parolă incorectă")
      setLoading(false)
    } else if (result?.url) {
      fetch('/api/auth/activity', { method: 'POST' }).catch(() => {})
      window.location.href = result.url
    }
  }

  return (
    <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.1] rounded-3xl p-8 sm:p-10 shadow-2xl shadow-purple-950/40">
      <div className="w-16 h-1 bg-gradient-to-r from-[#a007dc] to-[#d063f0] rounded-full mx-auto mb-8" />

      <p className="text-center text-[#f8f9fa]/40 text-xs font-semibold tracking-[0.2em] uppercase mb-6">
        Perspectiva Evei
      </p>

      <h1 className="text-[#f8f9fa] text-2xl font-bold text-center mb-2">
        Bine ai revenit
      </h1>
      <p className="text-[#f8f9fa]/60 text-sm text-center mb-8">
        Loghează-te în contul tău pentru a continua.
      </p>

      {registered && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-300 text-sm mb-4">
          Cont creat cu succes! Te poți logha acum.
        </div>
      )}

      {reset && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-300 text-sm mb-4">
          Parola a fost resetată cu succes!
        </div>
      )}

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

        <div>
          <label htmlFor="password" className="block text-[#f8f9fa]/70 text-sm font-medium mb-1.5">
            Parolă
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClasses}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full bg-gradient-to-r from-[#a007dc] to-[#c23de6] text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#a007dc]/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? "Se încarcă..." : "Loghează-te"}
        </button>
      </form>

      <div className="h-px bg-white/[0.1] my-6" />

      <div className="text-center space-y-2 text-sm">
        <p className="text-[#f8f9fa]/50">
          Ți-ai uitat parola?{" "}
          <Link href="/resetare-parola" className="text-[#f8f9fa]/80 underline hover:text-[#f8f9fa] transition-colors">
            Resetează parola
          </Link>
        </p>
        <p className="text-[#f8f9fa]/50">
          Nu ai cont?{" "}
          <Link href="/inregistrare" className="text-[#f8f9fa]/80 underline hover:text-[#f8f9fa] transition-colors">
            Creează unul
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LogarePage() {
  return (
    <Suspense fallback={<div className="text-[#f8f9fa]/50 text-center py-20">Se încarcă...</div>}>
      <LogareForm />
    </Suspense>
  )
}
