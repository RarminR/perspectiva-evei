import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  BOOKED: 'Rezervat',
  COMPLETED: 'Finalizat',
  CANCELLED: 'Anulat',
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'BOOKED':
      return 'bg-blue-100 text-blue-700'
    case 'COMPLETED':
      return 'bg-green-100 text-green-700'
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-500'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export default async function ProgramariPage() {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/logare')

  const sessions = await prisma.session1on1.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { scheduledAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#51087e]">Programări 1:1</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {sessions.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">Nicio programare găsită.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50">
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium">Durată</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Zoom</th>
                  <th className="px-6 py-3 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{s.user.name}</p>
                      <p className="text-gray-500 text-xs">{s.user.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {new Date(s.scheduledAt).toLocaleString('ro-RO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{s.duration} min</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(s.status)}`}
                      >
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {s.zoomLink ? (
                        <a
                          href={s.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#51087e] hover:text-[#a007dc] font-medium"
                        >
                          Link Zoom
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                      {s.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
