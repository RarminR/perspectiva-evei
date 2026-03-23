import Link from 'next/link'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { CourseEditForm } from './CourseEditForm'

export const dynamic = 'force-dynamic'

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default async function CourseEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const course = await prisma.course.findUnique({ where: { id } })

  if (!course) notFound()

  const editions = await prisma.courseEdition.findMany({
    where: { courseId: id },
    include: {
      lessons: { orderBy: { order: 'asc' } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { editionNumber: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin/cursuri" className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">
            ← Inapoi la cursuri
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Editeaza curs</h1>
        </div>
        <Link
          href={`/admin/cursuri/${id}/editii`}
          className="px-4 py-2 bg-[#a007dc] text-white rounded-lg hover:bg-[#a007dc]/90 transition-colors text-sm font-medium"
        >
          Editii
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <CourseEditForm course={course} />
      </div>

      {editions.map((edition) => (
        <div key={edition.id} className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Editia {edition.editionNumber}
              </h2>
              <p className="text-sm text-gray-500">
                {edition._count.enrollments} cursanti
              </p>
            </div>
            <Link
              href={`/admin/cursuri/${id}/editii/${edition.id}/lectii`}
              className="text-sm text-[#a007dc] hover:underline font-medium"
            >
              Gestioneaza lectii →
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {edition.lessons.length === 0 ? (
              <p className="p-6 text-sm text-gray-400">Nicio lectie.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-gray-500">
                      <th className="px-4 py-3 font-medium w-10">#</th>
                      <th className="px-4 py-3 font-medium">Titlu</th>
                      <th className="px-4 py-3 font-medium">Data sesiunii</th>
                      <th className="px-4 py-3 font-medium">Durata</th>
                      <th className="px-4 py-3 font-medium">Video</th>
                      <th className="px-4 py-3 font-medium">Zoom</th>
                      <th className="px-4 py-3 font-medium">Materiale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edition.lessons.map((lesson) => {
                      const hasVideo = Boolean(lesson.videoKey)
                      const hasZoom = Boolean(lesson.zoomLink)
                      const isPast = lesson.availableFrom && lesson.availableFrom < new Date()
                      const isFuture = lesson.availableFrom && lesson.availableFrom >= new Date()

                      return (
                        <tr key={lesson.id} className="border-b border-gray-50 last:border-0">
                          <td className="px-4 py-3 text-gray-400">{lesson.order}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{lesson.title}</td>
                          <td className="px-4 py-3">
                            {lesson.availableFrom ? (
                              <span className={isFuture ? 'text-[#a007dc] font-medium' : 'text-gray-500'}>
                                {formatDateTime(lesson.availableFrom)}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {lesson.duration ? `${lesson.duration} min` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {hasVideo ? (
                              <span className="text-green-600 font-medium">Da</span>
                            ) : isPast ? (
                              <span className="text-amber-500">Lipseste</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {hasZoom ? (
                              <span className="text-green-600 font-medium">Da</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {lesson.pdfKeys.length > 0 ? `${lesson.pdfKeys.length} PDF` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
