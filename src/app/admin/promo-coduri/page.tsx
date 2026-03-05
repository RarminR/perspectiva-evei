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

export default async function PromoCoduriPage() {
  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Coduri Promoționale</h1>
        <Link
          href="/admin/promo-coduri/new"
          className="px-4 py-2 bg-[#a007dc] text-white rounded-lg text-sm font-medium hover:bg-[#d4177e] transition"
        >
          + Cod Nou
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {codes.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">Niciun cod promoțional încă.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-4 font-medium">Cod</th>
                  <th className="p-4 font-medium">Tip</th>
                  <th className="p-4 font-medium">Valoare</th>
                  <th className="p-4 font-medium">Utilizări</th>
                  <th className="p-4 font-medium">Valabil</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr key={code.id} className="border-b border-gray-50 last:border-0">
                    <td className="p-4 font-mono font-bold text-gray-900">{code.code}</td>
                    <td className="p-4 text-gray-600">
                      {code.type === 'PERCENTAGE' ? 'Procent' : 'Fix'}
                    </td>
                    <td className="p-4 text-gray-900">
                      {code.type === 'PERCENTAGE' ? `${code.value}%` : `€${code.value.toFixed(2)}`}
                    </td>
                    <td className="p-4 text-gray-600">
                      {code.currentUses}{code.maxUses ? `/${code.maxUses}` : ''}
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {code.validFrom ? formatDate(code.validFrom) : '—'}
                      {' → '}
                      {code.validUntil ? formatDate(code.validUntil) : '—'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          code.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {code.active ? 'Activ' : 'Inactiv'}
                      </span>
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
