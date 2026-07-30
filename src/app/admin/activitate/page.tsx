import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const DETAIL_ROWS_LIMIT = 500

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
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
  const windowWhere = { createdAt: { gte: twoMonthsAgo } }

  const [activities, totalCount, flaggedCount, perUserStats, perUserFlagged] = await Promise.all([
    prisma.loginActivity.findMany({
      where: windowWhere,
      take: DETAIL_ROWS_LIMIT,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.loginActivity.count({ where: windowWhere }),
    prisma.loginActivity.count({ where: { ...windowWhere, flagged: true } }),
    prisma.loginActivity.groupBy({
      by: ['userId'],
      _count: { id: true },
      _max: { createdAt: true },
      where: windowWhere,
    }),
    prisma.loginActivity.groupBy({
      by: ['userId'],
      _count: { id: true },
      where: { ...windowWhere, flagged: true },
    }),
  ])

  const users = await prisma.user.findMany({
    where: { id: { in: perUserStats.map((s) => s.userId) } },
    select: { id: true, name: true, email: true },
  })
  const userById = new Map(users.map((u) => [u.id, u]))
  const flaggedByUser = new Map(perUserFlagged.map((s) => [s.userId, s._count.id]))

  const perUser = perUserStats
    .map((s) => ({
      userId: s.userId,
      user: userById.get(s.userId),
      logins: s._count.id,
      flagged: flaggedByUser.get(s.userId) ?? 0,
      lastLogin: s._max.createdAt,
    }))
    .sort((a, b) => (b.lastLogin?.getTime() ?? 0) - (a.lastLogin?.getTime() ?? 0))

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raport Activitate</h1>
          <p className="text-sm text-gray-500 mt-1">Login-urile din ultimele 2 luni</p>
        </div>
        {flaggedCount > 0 && (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
            {flaggedCount} login-uri suspecte
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Total login-uri (2 luni)</p>
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Login-uri suspecte</p>
          <p className="text-2xl font-bold text-red-600">{flaggedCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Utilizatori activi</p>
          <p className="text-2xl font-bold text-gray-900">{perUser.length}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Activitate pe utilizator</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        {perUser.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">Nicio activitate în ultimele 2 luni.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50">
                  <th className="px-4 py-3 font-medium">Utilizator</th>
                  <th className="px-4 py-3 font-medium">Login-uri</th>
                  <th className="px-4 py-3 font-medium">Suspecte</th>
                  <th className="px-4 py-3 font-medium">Ultimul login</th>
                </tr>
              </thead>
              <tbody>
                {perUser.map((row) => (
                  <tr key={row.userId} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{row.user?.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{row.user?.email || row.userId}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{row.logins}</td>
                    <td className="px-4 py-3">
                      {row.flagged > 0 ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                          {row.flagged}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.lastLogin ? (
                        <>
                          <span title={formatDate(row.lastLogin)}>{timeAgo(row.lastLogin)}</span>
                          <span className="text-xs text-gray-400 block">{formatDate(row.lastLogin)}</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Toate login-urile</h2>
      {totalCount > DETAIL_ROWS_LIMIT && (
        <p className="text-xs text-gray-500 mb-3">
          Se afișează cele mai recente {DETAIL_ROWS_LIMIT} din {totalCount} login-uri.
        </p>
      )}
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
