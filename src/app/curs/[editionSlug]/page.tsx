import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { LessonCard } from './components/LessonCard'

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

  const course = await prisma.course.findUnique({
    where: { slug: editionSlug },
    select: { id: true },
  })

  let edition
  if (course) {
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: { userId, edition: { courseId: course.id } },
      orderBy: { createdAt: 'desc' },
      select: { editionId: true },
    })

    if (enrollment) {
      edition = await prisma.courseEdition.findUnique({
        where: { id: enrollment.editionId },
        include: {
          course: true,
          lessons: { orderBy: { order: 'asc' } },
          enrollments: { where: { userId } },
        },
      })
    }
  } else {
    edition = await prisma.courseEdition.findUnique({
      where: { id: editionSlug },
      include: {
        course: true,
        lessons: { orderBy: { order: 'asc' } },
        enrollments: { where: { userId } },
      },
    })
  }

  if (!edition) {
    return (
      <main>
        <Navbar />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#666' }}>Cursul nu a fost găsit.</p>
        </div>
        <Footer />
      </main>
    )
  }

  const enrollment = edition.enrollments[0]
  const hasAccess = Boolean(enrollment && enrollment.accessExpiresAt > new Date())

  if (!hasAccess) {
    return (
      <main>
        <Navbar />
        <section style={{
          backgroundImage: 'linear-gradient(135deg, #51087e 0%, #2c0246 100%)',
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 1rem',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '440px' }}>
            <h1 style={{
              backgroundImage: 'linear-gradient(90deg, white, #e0e0e0)',
              WebkitTextFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '1rem',
            }}>Acces interzis</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem' }}>Nu ești înscris la această ediție a cursului.</p>
            <Link href="/cursul-ado" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              color: '#51087e',
              backgroundColor: 'white',
              border: '1px solid white',
              borderRadius: '999px',
              padding: '.75rem 2rem',
              textDecoration: 'none',
              fontWeight: 600,
            }}>
              Înscrie-te acum
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  const progress = await prisma.lessonProgress.findMany({
    where: { userId, lesson: { editionId: edition.id } },
    select: { lessonId: true, completed: true },
  })

  const watchedLessonIds = new Set(progress.filter((e) => e.completed).map((e) => e.lessonId))
  const completedCount = watchedLessonIds.size
  const totalCount = edition.lessons.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <main>
      <Navbar />

      <section style={{
        backgroundImage: 'linear-gradient(135deg, #51087e 0%, #a007dc 100%)',
        padding: '60px 5%',
        color: 'white',
      }}>
        <div style={{ maxWidth: '940px', margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <Link href="/profilul-meu" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Profilul meu</Link>
            {' › '}Cursurile mele
          </p>
          <h1 style={{
            backgroundImage: 'linear-gradient(90deg, white, #e0e0e0)',
            WebkitTextFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 700,
            margin: '0 0 0.5rem',
          }}>{edition.course.title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 1.5rem' }}>Ediția {edition.editionNumber}</p>

          <div style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>{completedCount} din {totalCount} lecții completate</span>
              <span style={{ color: 'white', fontWeight: 600 }}>{progressPct}%</span>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                backgroundColor: 'white',
                height: '100%',
                width: `${progressPct}%`,
                borderRadius: '999px',
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        </div>
      </section>

      <section style={{
        backgroundImage: 'linear-gradient(180deg, white, #e8c2ff)',
        padding: '60px 5%',
        minHeight: '50vh',
      }}>
        <div style={{ maxWidth: '940px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {edition.lessons.map((lesson, idx) => (
              <LessonCard
                key={lesson.id}
                index={idx}
                lessonId={lesson.id}
                editionSlug={edition.id}
                title={lesson.title}
                duration={lesson.duration}
                availableFrom={lesson.availableFrom?.toISOString() ?? null}
                zoomLink={lesson.zoomLink}
                videoKey={lesson.videoKey}
                pdfKeys={lesson.pdfKeys}
                isWatched={watchedLessonIds.has(lesson.id)}
              />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
