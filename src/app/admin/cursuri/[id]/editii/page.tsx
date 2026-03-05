import Link from 'next/link'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default async function EditionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const course = await prisma.course.findUnique({
    where: { id },
    select: { id: true, title: true },
  })

  if (!course) notFound()

  const editions = await prisma.courseEdition.findMany({
    where: { courseId: id },
    include: { _count: { select: { enrollments: true } } },
    orderBy: { editionNumber: 'asc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href={`/admin/cursuri/${id}`} className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">
            ← {course.title}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Ediții</h1>
        </div>
        <Link
          href={`/admin/cursuri/${id}/editii/new`}
          className="px-4 py-2 bg-[#51087e] text-white rounded-lg hover:bg-[#51087e]/90 transition-colors text-sm font-medium"
        >
          Adaugă ediție
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-4 font-medium">Ediție</th>
                <th className="px-6 py-4 font-medium">Perioada</th>
                <th className="px-6 py-4 font-medium">Locuri</th>
                <th className="px-6 py-4 font-medium">Cursanți</th>
                <th className="px-6 py-4 font-medium">Înscriere</th>
                <th className="px-6 py-4 font-medium">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {editions.map((edition) => (
                <tr key={edition.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    Ediția {edition.editionNumber}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {formatDate(edition.startDate)} – {formatDate(edition.endDate)}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{edition.maxParticipants}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {edition._count.enrollments} cursanți
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        edition.enrollmentOpen
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {edition.enrollmentOpen ? 'Deschisă' : 'Închisă'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/cursuri/${id}/editii/${edition.id}`}
                        className="text-[#51087e] hover:underline font-medium"
                      >
                        Editează
                      </Link>
                      <Link
                        href={`/admin/cursuri/${id}/editii/${edition.id}/lectii`}
                        className="text-[#a007dc] hover:underline font-medium"
                      >
                        Lecții
                      </Link>
                      <Link
                        href={`/admin/cursuri/${id}/editii/${edition.id}/cursanti`}
                        className="text-gray-500 hover:underline font-medium"
                      >
                        Cursanți
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {editions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nicio ediție încă.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
