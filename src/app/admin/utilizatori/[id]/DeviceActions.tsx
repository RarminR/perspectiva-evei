'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeviceActions({
  userId,
  deviceId,
}: {
  userId: string
  deviceId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    if (!confirm('Sigur vrei să elimini acest dispozitiv?')) return

    setLoading(true)
    try {
      await fetch(`/api/admin/users/${userId}/devices`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
    >
      {loading ? 'Se elimină...' : 'Elimină'}
    </button>
  )
}
