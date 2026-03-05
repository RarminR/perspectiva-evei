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
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#aaa' }}>Lecția nu a fost găsită.</p>
      </div>
    )
  }

  const enrollment = lesson.edition.enrollments[0]
  const hasAccess = Boolean(enrollment && enrollment.accessExpiresAt > new Date())

  if (!hasAccess) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Acces interzis</h1>
          <p style={{ color: '#aaa' }}>Nu ești înscris la acest curs.</p>
        </div>
      </div>
    )
  }

  if (lesson.availableFrom && lesson.availableFrom > new Date()) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Lecție indisponibilă</h1>
          <p style={{ color: '#aaa' }}>
            Această lecție va fi disponibilă din {lesson.availableFrom.toLocaleDateString('ro-RO')}.
          </p>
        </div>
      </div>
    )
  }

  const lessons = lesson.edition.lessons
  const currentIdx = lessons.findIndex((e) => e.id === lesson.id)
  const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null
  const nextLesson = currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d0d0d', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar — dark navbar for video context */}
      <div style={{
        backgroundColor: '#1a0030',
        borderBottom: '1px solid rgba(160,7,220,0.3)',
        padding: '0.75rem 5%',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <Link href={`/curs/${editionSlug}`} style={{
          color: 'rgba(255,255,255,0.6)',
          textDecoration: 'none',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          ← {lesson.edition.course.title}
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>›</span>
        <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500 }}>{lesson.title}</span>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '2rem 5%', flex: 1 }}>
        {/* Video player */}
        <div style={{ marginBottom: '2rem' }}>
          {lesson.videoKey ? (
            <SecureVideoPlayer hlsSrc={lesson.videoKey} editionId={lesson.edition.id} lessonId={lesson.id} />
          ) : (
            <div style={{
              aspectRatio: '16/9',
              backgroundColor: '#1a1a2e',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: '1rem',
            }}>
              Video indisponibil
            </div>
          )}
        </div>

        {/* Lesson info */}
        <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>{lesson.title}</h1>
        {lesson.duration ? (
          <p style={{ color: '#aaa', marginBottom: '2rem' }}>{lesson.duration} minute</p>
        ) : null}

        {/* Prev / Next navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(160,7,220,0.2)',
        }}>
          {prevLesson ? (
            <Link href={`/curs/${editionSlug}/lectia/${prevLesson.id}`} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'white',
              backgroundColor: 'transparent',
              border: '1px solid rgba(160,7,220,0.5)',
              borderRadius: '999px',
              padding: '0.625rem 1.25rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}>
              ← {prevLesson.title}
            </Link>
          ) : <div />}

          {nextLesson ? (
            <Link href={`/curs/${editionSlug}/lectia/${nextLesson.id}`} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#51087e',
              backgroundColor: 'white',
              border: '1px solid white',
              borderRadius: '999px',
              padding: '0.625rem 1.25rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}>
              {nextLesson.title} →
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  )
}
