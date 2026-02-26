import Link from 'next/link'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { LessonManager } from './LessonManager'

export const dynamic = 'force-dynamic'

export default async function LessonsPage({
  params,
}: {
  params: Promise<{ id: string; editionId: string }>
}) {
  const { id, editionId } = await params

  const edition = await prisma.courseEdition.findUnique({
    where: { id: editionId },
    select: { id: true, courseId: true, editionNumber: true },
  })

  if (!edition) notFound()

  const lessons = await prisma.lesson.findMany({
    where: { editionId },
    orderBy: { order: 'asc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href={`/admin/cursuri/${id}/editii/${editionId}`}
            className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block"
          >
            ← Ediția {edition.editionNumber}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Lecții</h1>
        </div>
      </div>

      <LessonManager lessons={lessons} editionId={editionId} />
    </div>
  )
}
