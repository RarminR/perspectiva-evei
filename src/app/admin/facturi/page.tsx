import Link from 'next/link'
import { prisma } from '@/lib/db'
import type { InvoiceStatus } from '@prisma/client'

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

const VALID_STATUSES: string[] = ['PENDING', 'CREATED', 'FAILED', 'STORNO']

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'CREATED':
      return 'bg-green-100 text-green-700'
    case 'PENDING':
      return 'bg-amber-100 text-amber-700'
    case 'FAILED':
      return 'bg-red-100 text-red-700'
    case 'STORNO':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const statusFilter = params.status && VALID_STATUSES.includes(params.status)
    ? (params.status as InvoiceStatus)
    : undefined

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include: {
      order: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Facturi</h1>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {invoices.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">Nicio factură găsită.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50">
                  <th className="px-6 py-3 font-medium">Serie</th>
                  <th className="px-6 py-3 font-medium">Număr</th>
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">Sumă</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {invoice.smartbillSeries ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {invoice.smartbillNumber ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {invoice.order.user.name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {invoice.order.user.email}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {formatCurrency(invoice.order.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(invoice.status)}`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(invoice.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/facturi/${invoice.id}`}
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
