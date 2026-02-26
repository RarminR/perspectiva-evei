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

export default async function CaseStudiesPage() {
  const caseStudies = await prisma.caseStudy.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Studii de caz</h1>
        <Link
          href="/admin/studii-de-caz/new"
          className="px-4 py-2 bg-[#E91E8C] text-white rounded-lg text-sm font-medium hover:bg-[#d4177e] transition"
        >
          Adaugă studiu de caz
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {caseStudies.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">Niciun studiu de caz încă.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-4 font-medium">Titlu</th>
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Creat</th>
                  <th className="p-4 font-medium">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {caseStudies.map((cs) => (
                  <tr key={cs.id} className="border-b border-gray-50 last:border-0">
                    <td className="p-4 font-medium text-gray-900">{cs.title}</td>
                    <td className="p-4 text-gray-500">{cs.clientName || '—'}</td>
                    <td className="p-4">
                      {cs.published ? (
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          Publicat
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500">{formatDate(cs.createdAt)}</td>
                    <td className="p-4">
                      <Link
                        href={`/admin/studii-de-caz/${cs.id}`}
                        className="text-[#E91E8C] hover:underline font-medium"
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
