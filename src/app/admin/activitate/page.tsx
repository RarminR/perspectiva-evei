import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'acum'
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}z`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default async function ActivitatePage() {
  const [activities, flaggedCount, userStats] = await Promise.all([
    prisma.loginActivity.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.loginActivity.count({ where: { flagged: true } }),
    prisma.loginActivity.groupBy({
      by: ['userId'],
      _count: { id: true },
      _max: { createdAt: true },
      where: { flagged: true },
    }),
  ])

  const flaggedUsers = new Set(userStats.map((s: { userId: string }) => s.userId))

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Raport Activitate</h1>
        {flaggedCount > 0 && (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
            {flaggedCount} login-uri suspecte
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Total login-uri</p>
          <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Login-uri suspecte</p>
          <p className="text-2xl font-bold text-red-600">{flaggedCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Utilizatori cu flag</p>
          <p className="text-2xl font-bold text-amber-600">{flaggedUsers.size}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {activities.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">Nicio activitate înregistrată.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50">
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Utilizator</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">Locație</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Detalii</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr
                    key={a.id}
                    className={`border-b border-gray-50 last:border-0 ${
                      a.flagged ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      {a.flagged ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Suspect
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{a.user.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{a.user.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {a.ip}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {a.city && a.country ? (
                        <>
                          {a.city}, {a.country}
                          {a.lat != null && a.lng != null && (
                            <span className="text-xs text-gray-400 block">
                              {a.lat.toFixed(2)}, {a.lng.toFixed(2)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">Local/Privat</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span title={formatDate(a.createdAt)}>{timeAgo(a.createdAt)}</span>
                      <span className="text-xs text-gray-400 block">{formatDate(a.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {a.flagReason && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          {a.flagReason}
                        </span>
                      )}
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
