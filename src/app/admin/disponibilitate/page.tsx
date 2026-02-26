import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const DAY_NAMES = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă']

export default async function DisponibilitatePage() {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/logare')

  const slots = await prisma.availability.findMany({
    where: { active: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })

  // Group slots by day
  const slotsByDay = new Map<number, typeof slots>()
  for (const slot of slots) {
    const existing = slotsByDay.get(slot.dayOfWeek) || []
    existing.push(slot)
    slotsByDay.set(slot.dayOfWeek, existing)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#2D1B69]">Disponibilitate</h1>
      </div>

      {/* Add new slot form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Adaugă interval</h2>
        <form method="POST" action="/api/admin/availability" className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 mb-1">
              Ziua
            </label>
            <select
              id="dayOfWeek"
              name="dayOfWeek"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent"
            >
              {DAY_NAMES.map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              Ora început
            </label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              defaultValue="09:00"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              Ora sfârșit
            </label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              defaultValue="17:00"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-[#2D1B69] text-white rounded-lg hover:bg-[#2D1B69]/90 text-sm font-medium"
          >
            Adaugă
          </button>
        </form>
      </div>

      {/* Current availability by day */}
      <div className="space-y-4">
        {DAY_NAMES.map((dayName, dayIndex) => {
          const daySlots = slotsByDay.get(dayIndex) || []
          return (
            <div
              key={dayIndex}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-3">{dayName}</h3>
              {daySlots.length === 0 ? (
                <p className="text-sm text-gray-400">Niciun interval configurat</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center gap-2 px-3 py-2 bg-[#2D1B69]/5 rounded-lg border border-[#2D1B69]/10"
                    >
                      <span className="text-sm font-medium text-[#2D1B69]">
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
