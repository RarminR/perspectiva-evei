"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function LogarePage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
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
      window.location.href = result.url
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
      <h1 className="text-2xl font-bold text-center mb-6">Intră în cont</h1>

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

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Parolă
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 rounded-lg bg-white text-brand-purple-dark font-semibold hover:bg-white/90 transition disabled:opacity-50"
        >
          {loading ? "Se încarcă..." : "Intră în cont"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm space-y-2">
        <p>
          Nu ai cont?{" "}
          <Link href="/inregistrare" className="underline hover:text-white/80">
            Creează cont
          </Link>
        </p>
        <p>
          <Link
            href="/resetare-parola"
            className="underline hover:text-white/80"
          >
            Ai uitat parola?
          </Link>
        </p>
      </div>
    </div>
  )
}
