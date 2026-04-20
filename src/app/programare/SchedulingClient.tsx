'use client'

import { useState, useEffect, useCallback } from 'react'

interface GroupedSlots {
  [date: string]: string[]
}

export default function SchedulingClient() {
  const [slots, setSlots] = useState<GroupedSlots>({})
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<string | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/scheduling/slots')
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Eroare la încărcare')

      const grouped: GroupedSlots = {}
      for (const iso of data.slots) {
        const d = new Date(iso)
        const dateKey = d.toLocaleDateString('ro-RO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        if (!grouped[dateKey]) grouped[dateKey] = []
        grouped[dateKey].push(iso)
      }
      setSlots(grouped)
    } catch {
      setMessage({ type: 'error', text: 'Nu s-au putut încărca sloturile.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  function handleBook(scheduledAt: string) {
    setBooking(scheduledAt)
    const params = new URLSearchParams({
      product: 'SESSION',
      scheduledAt,
    })
    window.location.href = `/checkout?${params.toString()}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#a007dc] border-t-transparent" />
        <span className="ml-3 text-gray-600">Se încarcă disponibilitatea...</span>
      </div>
    )
  }

  const dateKeys = Object.keys(slots)

  return (
    <div>
      {message && (
        <div
          className={`mb-6 rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {dateKeys.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">
            Nu există sloturi disponibile în următoarele 2 săptămâni.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Te rugăm să verifici mai târziu.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dateKeys.map((dateLabel) => (
            <div
              key={dateLabel}
              className="rounded-lg border border-gray-200 bg-white p-6"
            >
              <h2 className="mb-4 text-lg font-semibold capitalize text-[#51087e]">
                {dateLabel}
              </h2>
              <div className="flex flex-wrap gap-3">
                {slots[dateLabel].map((iso) => {
                  const d = new Date(iso)
                  const timeLabel = d.toLocaleTimeString('ro-RO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  const isBooking = booking === iso

                  return (
                    <button
                      key={iso}
                      onClick={() => handleBook(iso)}
                      disabled={isBooking}
                      className="rounded-lg border-2 border-[#a007dc] px-5 py-2.5 text-sm font-medium text-[#a007dc] transition-colors hover:bg-[#a007dc] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBooking ? 'Se programează...' : timeLabel}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
