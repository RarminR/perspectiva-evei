'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SetCurrentButton({ editionId, isCurrent }: { editionId: string; isCurrent: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (isCurrent) {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#a007dc] text-white">
        Actuală
      </span>
    )
  }

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/editions/${editionId}/set-current`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Eroare')
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-medium text-[#51087e] hover:underline disabled:opacity-50"
    >
      {loading ? 'Se setează…' : 'Setează ca actuală'}
    </button>
  )
}
