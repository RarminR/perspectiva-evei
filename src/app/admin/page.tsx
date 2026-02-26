import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const STAT_CARDS = [
  { key: 'users', label: 'Utilizatori', icon: '👥', color: 'bg-blue-50 text-blue-700' },
  { key: 'enrollments', label: 'Înscrieri active', icon: '🎓', color: 'bg-green-50 text-green-700' },
  { key: 'revenue', label: 'Venit lunar', icon: '💰', color: 'bg-purple-50 text-purple-700' },
  { key: 'pending', label: 'Comenzi în așteptare', icon: '📦', color: 'bg-amber-50 text-amber-700' },
]

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default async function AdminDashboard() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalUsers, activeEnrollments, revenueAgg, pendingOrders, recentOrders] =
    await Promise.all([
      prisma.user.count(),
      prisma.courseEnrollment.count({
        where: { accessExpiresAt: { gt: now } },
      }),
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ])

  const monthlyRevenue = revenueAgg._sum.totalAmount ?? 0

  const stats: Record<string, string> = {
    users: String(totalUsers),
    enrollments: String(activeEnrollments),
    revenue: formatCurrency(monthlyRevenue),
    pending: String(pendingOrders),
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">
                {card.label}
              </span>
              <span
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${card.color}`}
              >
                {card.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats[card.key]}
            </p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Comenzi recente
        </h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-sm">Nicio comandă încă.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Sumă</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="py-3">
                      <p className="font-medium text-gray-900">
                        {order.user.name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {order.user.email}
                      </p>
                    </td>
                    <td className="py-3 text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {formatDate(order.createdAt)}
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
