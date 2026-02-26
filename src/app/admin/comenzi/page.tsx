import Link from 'next/link'
import { prisma } from '@/lib/db'
import type { OrderStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const STATUS_OPTIONS = ['ALL', 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const
const VALID_STATUSES: string[] = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-700'
    case 'PENDING':
      return 'bg-amber-100 text-amber-700'
    case 'FAILED':
      return 'bg-red-100 text-red-700'
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; userId?: string }>
}) {
  const params = await searchParams
  const statusFilter = params.status && VALID_STATUSES.includes(params.status)
    ? (params.status as OrderStatus)
    : undefined

  const orders = await prisma.order.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(params.userId ? { userId: params.userId } : {}),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Comenzi</h1>
      </div>

      {/* Status filter */}
      <form method="GET" className="mb-6">
        <select
          name="status"
          defaultValue={params.status ?? 'ALL'}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D1B69] focus:border-transparent"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'Toate statusurile' : s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="ml-2 px-4 py-2 bg-[#2D1B69] text-white rounded-lg hover:bg-[#2D1B69]/90 text-sm font-medium"
        >
          Filtrează
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {orders.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">Nicio comandă găsită.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50">
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">Sumă</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {order.id.slice(0, 8)}…
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {order.user.name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {order.user.email}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/comenzi/${order.id}`}
                        className="text-[#2D1B69] hover:text-[#E91E8C] font-medium text-sm"
                      >
                        Detalii
                      </Link>
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
