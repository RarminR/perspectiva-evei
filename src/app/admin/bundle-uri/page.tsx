import Link from 'next/link'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function formatPrice(price: number): string {
  return `€${price.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default async function BundleUriPage() {
  const bundles = await prisma.bundle.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bundle-uri</h1>
        <Link
          href="/admin/bundle-uri/new"
          className="px-4 py-2 bg-[#a007dc] text-white rounded-lg text-sm font-medium hover:bg-[#d4177e] transition"
        >
          + Bundle Nou
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {bundles.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">Niciun bundle încă.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-4 font-medium">Titlu</th>
                  <th className="p-4 font-medium">Preț</th>
                  <th className="p-4 font-medium">Preț Original</th>
                  <th className="p-4 font-medium">Produse</th>
                  <th className="p-4 font-medium">Creat</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bundles.map((bundle) => (
                  <tr key={bundle.id} className="border-b border-gray-50 last:border-0">
                    <td className="p-4 font-medium text-gray-900">{bundle.title}</td>
                    <td className="p-4 text-gray-900">{formatPrice(bundle.price)}</td>
                    <td className="p-4 text-gray-500 line-through">{formatPrice(bundle.originalPrice)}</td>
                    <td className="p-4 text-gray-600">{bundle.items.length} ghiduri</td>
                    <td className="p-4 text-gray-500">{formatDate(bundle.createdAt)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          bundle.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {bundle.active ? 'Activ' : 'Inactiv'}
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
