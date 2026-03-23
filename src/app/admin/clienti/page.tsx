import Link from 'next/link'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default async function AdminClientsPage() {
  const now = new Date()

  const clients = await prisma.user.findMany({
    where: { role: 'USER' },
    include: {
      enrollments: {
        include: { edition: { include: { course: { select: { title: true } } } } },
        orderBy: { createdAt: 'desc' },
      },
      orders: {
        where: { status: 'COMPLETED' },
        select: { totalAmount: true },
      },
      sessions: {
        where: { status: 'BOOKED', scheduledAt: { gt: now } },
        select: { scheduledAt: true },
        orderBy: { scheduledAt: 'asc' },
        take: 1,
      },
      _count: {
        select: { messages: { where: { fromAdmin: false, read: false } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const clientRows = clients.map((c) => {
    const totalSpent = c.orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const activeEnrollments = c.enrollments.filter((e) => e.accessExpiresAt > now)
    const nextSession = c.sessions[0]?.scheduledAt ?? null

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      createdAt: c.createdAt,
      totalSpent,
      activeEnrollments,
      allEnrollments: c.enrollments,
      nextSession,
      unreadMessages: c._count.messages,
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Clienți</h1>
      <p className="text-sm text-gray-500 mb-6">{clientRows.length} clienți înregistrați</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Cursuri active</th>
                <th className="px-6 py-4 font-medium">Total cheltuit</th>
                <th className="px-6 py-4 font-medium">Sesiune următoare</th>
                <th className="px-6 py-4 font-medium">Mesaje necitite</th>
                <th className="px-6 py-4 font-medium">Înregistrat</th>
                <th className="px-6 py-4 font-medium">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {clientRows.map((client) => (
                <tr key={client.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-gray-500 text-xs">{client.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    {client.activeEnrollments.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {client.activeEnrollments.map((e) => (
                          <span key={e.id} className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {e.edition.course.title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    €{client.totalSpent.toLocaleString('ro-RO', { minimumFractionDigits: 0 })}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {client.nextSession ? formatDate(client.nextSession) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {client.unreadMessages > 0 ? (
                      <span
                        className="inline-flex items-center justify-center text-xs font-bold text-white rounded-full"
                        style={{ backgroundColor: '#a007dc', width: '22px', height: '22px' }}
                      >
                        {client.unreadMessages}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/utilizatori/${client.id}`}
                        className="text-[#51087e] hover:text-[#a007dc] text-xs font-medium"
                      >
                        Profil
                      </Link>
                      <Link
                        href="/admin/mesaje"
                        className="text-[#51087e] hover:text-[#a007dc] text-xs font-medium"
                      >
                        Mesaj
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
