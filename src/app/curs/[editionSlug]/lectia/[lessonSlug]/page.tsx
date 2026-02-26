import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SecureVideoPlayer } from '@/components/SecureVideoPlayer'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ editionSlug: string; lessonSlug: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/logare')

  const { editionSlug, lessonSlug } = await params
  const userId = (session.user as any).id

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonSlug },
    include: {
      edition: {
        include: {
          course: true,
          lessons: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true, order: true },
          },
          enrollments: { where: { userId } },
        },
      },
    },
  })

  if (!lesson || lesson.edition.id !== editionSlug) {
    return <div className="p-8 text-center">Lecția nu a fost găsită.</div>
  }

  const enrollment = lesson.edition.enrollments[0]
  const hasAccess = Boolean(enrollment && enrollment.accessExpiresAt > new Date())

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF2F8]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#2D1B69] mb-4">Acces interzis</h1>
          <p className="text-gray-600">Nu ești înscris la acest curs.</p>
        </div>
      </div>
    )
  }

  if (lesson.availableFrom && lesson.availableFrom > new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF2F8]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#2D1B69] mb-4">Lecție indisponibilă</h1>
          <p className="text-gray-600">
            Această lecție va fi disponibilă din {lesson.availableFrom.toLocaleDateString('ro-RO')}.
          </p>
        </div>
      </div>
    )
  }

  const lessons = lesson.edition.lessons
  const currentIdx = lessons.findIndex((entry) => entry.id === lesson.id)
  const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null
  const nextLesson = currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-sm text-gray-400 mb-4">
          <Link href={`/curs/${editionSlug}`} className="hover:text-white">{lesson.edition.course.title}</Link>
          <span className="mx-2">›</span>
          <span className="text-white">{lesson.title}</span>
        </div>

        <div className="mb-6">
          {lesson.videoKey ? (
            <SecureVideoPlayer hlsSrc={lesson.videoKey} editionId={lesson.edition.id} lessonId={lesson.id} />
          ) : (
            <div className="aspect-video bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
              Video indisponibil
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">{lesson.title}</h1>
        {lesson.duration ? <p className="text-gray-400 mb-6">{lesson.duration} minute</p> : null}

        <div className="flex justify-between mt-8">
          {prevLesson ? (
            <Link href={`/curs/${editionSlug}/lectia/${prevLesson.id}`} className="flex items-center gap-2 text-[#E91E8C] hover:underline">
              ← {prevLesson.title}
            </Link>
          ) : (
            <div />
          )}
          {nextLesson ? (
            <Link href={`/curs/${editionSlug}/lectia/${nextLesson.id}`} className="flex items-center gap-2 text-[#E91E8C] hover:underline">
              {nextLesson.title} →
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  )
}
