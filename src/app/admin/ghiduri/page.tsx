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

export default async function GuidesPage() {
  const guides = await prisma.guide.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ghiduri</h1>
        <Link
          href="/admin/ghiduri/new"
          className="px-4 py-2 bg-[#a007dc] text-white rounded-lg text-sm font-medium hover:bg-[#d4177e] transition"
        >
          Adaugă ghid
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {guides.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">Niciun ghid încă.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-4 font-medium">Titlu</th>
                  <th className="p-4 font-medium">Slug</th>
                  <th className="p-4 font-medium">Preț</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Creat</th>
                  <th className="p-4 font-medium">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {guides.map((guide) => (
                  <tr key={guide.id} className="border-b border-gray-50 last:border-0">
                    <td className="p-4 font-medium text-gray-900">{guide.title}</td>
                    <td className="p-4 text-gray-500">{guide.slug}</td>
                    <td className="p-4 text-gray-900">{formatPrice(guide.price)}</td>
                    <td className="p-4">
                      {guide.published === false ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                          Ascuns
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Publicat
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500">{formatDate(guide.createdAt)}</td>
                    <td className="p-4">
                      <Link
                        href={`/admin/ghiduri/${guide.id}`}
                        className="text-[#a007dc] hover:underline font-medium"
                      >
                        Editează
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
