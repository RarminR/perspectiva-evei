"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ResetareParolaTokenPage({
  params,
}: {
  params: { token: string }
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    const formData = new FormData(e.currentTarget)
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
      const res = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "A apărut o eroare")
        setLoading(false)
        return
      }

      router.push("/logare?reset=true")
    } catch {
      setError("A apărut o eroare de rețea")
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
      <h1 className="text-2xl font-bold text-center mb-6">Parolă nouă</h1>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Parolă nouă
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder="Minim 8 caractere"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1"
          >
            Confirmă parola
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder="Repetă parola"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 rounded-lg bg-white text-brand-purple-dark font-semibold hover:bg-white/90 transition disabled:opacity-50"
        >
          {loading ? "Se resetează..." : "Resetează parola"}
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
