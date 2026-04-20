import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { RefundButton } from './RefundButton'
import { GenerateInvoiceButton } from './GenerateInvoiceButton'

export const dynamic = 'force-dynamic'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

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

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: true,
      invoices: true,
    },
  })

  if (!order) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/comenzi"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Înapoi la comenzi
        </Link>
      </div>

      {/* Order info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">
            Comandă #{order.id.slice(0, 8)}
          </h1>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClass(order.status)}`}
          >
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Client</p>
            <p className="font-medium text-gray-900">{order.user.name}</p>
            <p className="text-sm text-gray-500">{order.user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Sumă totală</p>
            <p className="font-medium text-gray-900">
              {formatCurrency(order.totalAmount)} {order.currency}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Data</p>
            <p className="font-medium text-gray-900">
              {formatDate(order.createdAt)}
            </p>
          </div>
          {order.revolutOrderId && (
            <div>
              <p className="text-sm text-gray-500">Revolut Order ID</p>
              <p className="font-mono text-xs text-gray-700">
                {order.revolutOrderId}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Produse comandate
        </h2>
        {order.items.length === 0 ? (
          <p className="text-gray-500 text-sm">Niciun produs.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="pb-3 font-medium">Tip</th>
                  <th className="pb-3 font-medium">ID Produs</th>
                  <th className="pb-3 font-medium">Cantitate</th>
                  <th className="pb-3 font-medium">Preț unitar</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="py-3 text-gray-900">{item.productType}</td>
                    <td className="py-3 font-mono text-xs text-gray-500">
                      {item.productId.slice(0, 8)}
                    </td>
                    <td className="py-3 text-gray-900">{item.quantity}</td>
                    <td className="py-3 text-gray-900">
                      {formatCurrency(item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoices */}
      {order.invoices.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Facturi
          </h2>
          <div className="space-y-2">
            {order.invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/admin/facturi/${inv.id}`}
                className="block p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">
                  {inv.smartbillSeries} {inv.smartbillNumber}
                </span>
                <span className="ml-3 text-xs text-gray-500">{inv.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {order.status === 'COMPLETED' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Acțiuni
          </h2>
          <div className="flex flex-wrap gap-3">
            <RefundButton orderId={order.id} />
            {order.invoices.length === 0 && (
              <GenerateInvoiceButton orderId={order.id} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
