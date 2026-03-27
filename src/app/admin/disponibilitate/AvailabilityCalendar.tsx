'use client'

import { useCallback, useEffect, useState } from 'react'

interface Slot {
  id: string
  date: string
  startTime: string
  endTime: string
}

const DAY_LABELS = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă']
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7)

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + n)
  return result
}

function formatDateShort(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6)
  const months = [
    'Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun',
    'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `${monday.getDate()} ${months[monday.getMonth()]} – ${sunday.getDate()} ${months[sunday.getMonth()]} ${sunday.getFullYear()}`
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function timeToRow(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h - 7) * 2 + Math.round(m / 30)
}

interface AddFormState {
  date: string
  startTime: string
  endTime: string
}

export function AvailabilityCalendar() {
  const [monday, setMonday] = useState(() => getMonday(new Date()))
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [addForm, setAddForm] = useState<AddFormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    const from = monday.toISOString()
    const to = addDays(monday, 6).toISOString()
    try {
      const res = await fetch(`/api/admin/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      if (res.ok) {
        const data = await res.json()
        setSlots(data.slots.map((s: any) => ({
          id: s.id,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
        })))
      }
    } catch {
      /* empty — calendar shows no slots */
    } finally {
      setLoading(false)
    }
  }, [monday])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  function slotsForDay(dateKey: string): Slot[] {
    return slots.filter((s) => {
      const slotDate = new Date(s.date)
      return toDateKey(slotDate) === dateKey
    })
  }

  function navigateWeek(direction: -1 | 1) {
    setMonday((prev) => addDays(prev, direction * 7))
  }

  function goToToday() {
    setMonday(getMonday(new Date()))
  }

  function handleCellClick(dayDate: Date, hour: number) {
    setAddForm({
      date: toDateKey(dayDate),
      startTime: `${String(hour).padStart(2, '0')}:00`,
      endTime: `${String(hour + 1).padStart(2, '0')}:00`,
    })
  }

  async function handleAdd() {
    if (!addForm) return
    setSaving(true)

    try {
      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: addForm.date,
          startTime: addForm.startTime,
          endTime: addForm.endTime,
        }),
      })

      if (res.ok) {
        setAddForm(null)
        await fetchSlots()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/availability/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchSlots()
      }
    } finally {
      setDeletingId(null)
    }
  }

  const totalRows = 16 * 2
  const today = toDateKey(new Date())

  function getAddFormDayLabel(): string {
    if (!addForm) return ''
    const d = new Date(addForm.date + 'T00:00:00')
    return `${DAY_LABELS[d.getDay()]} ${formatDateShort(d)}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
            title="Săptămâna anterioară"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg border border-[#51087e]/20 text-[#51087e] text-sm font-medium hover:bg-[#51087e]/5 transition-colors"
          >
            Azi
          </button>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
            title="Săptămâna următoare"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <h2 className="text-lg font-semibold text-[#51087e]">
          {formatWeekRange(monday)}
        </h2>
      </div>

      {addForm && (
        <div className="bg-white rounded-xl shadow-sm border border-[#51087e]/20 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#51087e]">
              Adaugă interval — {getAddFormDayLabel()}
            </h3>
            <button
              onClick={() => setAddForm(null)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              &times;
            </button>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">De la</label>
              <input
                type="time"
                value={addForm.startTime}
                onChange={(e) => setAddForm({ ...addForm, startTime: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#51087e]/30"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Până la</label>
              <input
                type="time"
                value={addForm.endTime}
                onChange={(e) => setAddForm({ ...addForm, endTime: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#51087e]/30"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-5 py-2 bg-[#51087e] text-white rounded-lg text-sm font-medium hover:bg-[#51087e]/90 disabled:opacity-50"
            >
              {saving ? 'Se salvează...' : 'Salvează'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-[#a007dc] border-t-transparent" />
            <span className="ml-3 text-sm text-gray-500">Se încarcă...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-100">
                <div className="p-3" />
                {weekDays.map((dayDate, i) => {
                  const dateKey = toDateKey(dayDate)
                  const isToday = dateKey === today
                  return (
                    <div
                      key={i}
                      className={`p-3 text-center border-l border-gray-100 ${isToday ? 'bg-[#51087e]/5' : ''}`}
                    >
                      <div className={`text-xs font-semibold uppercase tracking-wider ${isToday ? 'text-[#a007dc]' : 'text-[#51087e]'}`}>
                        {DAY_LABELS[dayDate.getDay()]}
                      </div>
                      <div className={`text-xs mt-0.5 ${isToday ? 'text-[#a007dc] font-bold' : 'text-gray-400'}`}>
                        {formatDateShort(dayDate)}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div
                className="grid grid-cols-[60px_repeat(7,1fr)]"
                style={{ gridTemplateRows: `repeat(${totalRows}, 20px)` }}
              >
                {HOURS.map((hour) => (
                  <div
                    key={`label-${hour}`}
                    className="text-[10px] text-gray-400 text-right pr-2 pt-px border-t border-gray-50"
                    style={{ gridRow: `${(hour - 7) * 2 + 1} / span 2` }}
                  >
                    {String(hour).padStart(2, '0')}:00
                  </div>
                ))}

                {weekDays.map((dayDate, colIdx) => {
                  const dateKey = toDateKey(dayDate)
                  const isToday = dateKey === today
                  const daySlots = slotsForDay(dateKey)

                  return (
                    <div
                      key={`col-${colIdx}`}
                      className={`relative border-l border-gray-100 ${isToday ? 'bg-[#51087e]/[0.02]' : ''}`}
                      style={{
                        gridColumn: colIdx + 2,
                        gridRow: `1 / span ${totalRows}`,
                      }}
                    >
                      {HOURS.map((hour) => (
                        <div
                          key={`cell-${colIdx}-${hour}`}
                          className="absolute inset-x-0 border-t border-gray-50 hover:bg-[#51087e]/[0.03] cursor-pointer transition-colors"
                          style={{
                            top: `${(hour - 7) * 2 * 20}px`,
                            height: '40px',
                          }}
                          onClick={() => handleCellClick(dayDate, hour)}
                        />
                      ))}

                      {daySlots.map((slot) => {
                        const startRow = timeToRow(slot.startTime)
                        const endRow = timeToRow(slot.endTime)
                        const span = Math.max(endRow - startRow, 1)

                        return (
                          <div
                            key={slot.id}
                            className="absolute inset-x-1 rounded-md bg-[#a007dc]/15 border border-[#a007dc]/30 flex items-center justify-between px-2 group z-10 hover:bg-[#a007dc]/25 transition-colors"
                            style={{
                              top: `${startRow * 20 + 1}px`,
                              height: `${span * 20 - 2}px`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[10px] font-medium text-[#51087e] truncate">
                              {slot.startTime} – {slot.endTime}
                            </span>
                            <button
                              onClick={() => handleDelete(slot.id)}
                              disabled={deletingId === slot.id}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs font-bold transition-opacity ml-1 shrink-0"
                              title="Șterge"
                            >
                              {deletingId === slot.id ? '...' : '×'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
