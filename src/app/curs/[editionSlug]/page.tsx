import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function CoursePage({
  params,
}: {
  params: Promise<{ editionSlug: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/logare')

  const { editionSlug } = await params
  const userId = (session.user as any).id

  const edition = await prisma.courseEdition.findUnique({
    where: { id: editionSlug },
    include: {
      course: true,
      lessons: { orderBy: { order: 'asc' } },
      enrollments: { where: { userId } },
    },
  })

  if (!edition) {
    return <div className="p-8 text-center">Cursul nu a fost găsit.</div>
  }

  const enrollment = edition.enrollments[0]
  const hasAccess = Boolean(enrollment && enrollment.accessExpiresAt > new Date())

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF2F8]">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-[#2D1B69] mb-4">Acces interzis</h1>
          <p className="text-gray-600 mb-6">Nu ești înscris la această ediție a cursului.</p>
          <a href="/cursul-ado" className="bg-[#E91E8C] text-white px-6 py-3 rounded-full font-semibold hover:opacity-90">
            Înscrie-te acum
          </a>
        </div>
      </div>
    )
  }

  const progress = await prisma.lessonProgress.findMany({
    where: { userId, lesson: { editionId: edition.id } },
    select: { lessonId: true, completed: true },
  })

  const watchedLessonIds = new Set(progress.filter((entry) => entry.completed).map((entry) => entry.lessonId))
  const now = new Date()

  return (
    <div className="min-h-screen bg-[#FDF2F8]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-[#2D1B69] mb-2">{edition.course.title}</h1>
        <p className="text-gray-500 mb-8">Ediția {edition.editionNumber}</p>

        <div className="space-y-3">
          {edition.lessons.map((lesson, idx) => {
            const isAvailable = !lesson.availableFrom || lesson.availableFrom <= now
            const isWatched = watchedLessonIds.has(lesson.id)

            return (
              <div key={lesson.id} className={`bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 ${!isAvailable ? 'opacity-60' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isWatched ? 'bg-green-100 text-green-700' : 'bg-[#FDF2F8] text-[#2D1B69]'}`}>
                  {isWatched ? '✓' : idx + 1}
                </div>

                <div className="flex-1">
                  <p className="font-medium text-[#2D1B69]">{lesson.title}</p>
                  {lesson.duration ? <p className="text-sm text-gray-500">{lesson.duration} min</p> : null}
                  {!isAvailable && lesson.availableFrom ? (
                    <p className="text-xs text-amber-600">
                      Disponibil din {lesson.availableFrom.toLocaleDateString('ro-RO')}
                    </p>
                  ) : null}
                </div>

                {isAvailable ? (
                  <Link href={`/curs/${editionSlug}/lectia/${lesson.id}`} className="text-[#E91E8C] font-medium text-sm hover:underline">
                    {isWatched ? 'Revizuiește' : 'Urmărește'} →
                  </Link>
                ) : (
                  <span className="text-gray-400 text-lg">🔒</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
