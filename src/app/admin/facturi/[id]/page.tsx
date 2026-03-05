import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { InvoiceActions } from './InvoiceActions'

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

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      order: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  })

  if (!invoice) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/facturi"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Înapoi la facturi
        </Link>
      </div>

      {/* Invoice info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">
            Factură {invoice.smartbillSeries} {invoice.smartbillNumber}
          </h1>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClass(invoice.status)}`}
          >
            {invoice.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Serie</p>
            <p className="font-medium text-gray-900">
              {invoice.smartbillSeries ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Număr</p>
            <p className="font-medium text-gray-900">
              {invoice.smartbillNumber ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Data creare</p>
            <p className="font-medium text-gray-900">
              {formatDate(invoice.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Client</p>
            <p className="font-medium text-gray-900">
              {invoice.order.user.name}
            </p>
            <p className="text-sm text-gray-500">{invoice.order.user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Sumă comandă</p>
            <p className="font-medium text-gray-900">
              {formatCurrency(invoice.order.totalAmount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Comandă</p>
            <Link
              href={`/admin/comenzi/${invoice.orderId}`}
              className="text-[#51087e] hover:text-[#a007dc] font-medium text-sm"
            >
              {invoice.orderId.slice(0, 8)}…
            </Link>
          </div>
        </div>

        {invoice.errorText && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-700">Eroare:</p>
            <p className="text-sm text-red-600">{invoice.errorText}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acțiuni</h2>
        <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
      </div>
    </div>
  )
}
