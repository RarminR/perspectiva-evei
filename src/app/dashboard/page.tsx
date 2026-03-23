import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { getUserGuides } from '@/services/guide'
import { getUserSessions } from '@/services/scheduling'
import { DashboardTabs } from './components/DashboardTabs'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard | Perspectiva Evei',
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/logare')
  const userId = (session.user as any).id

  const [user, enrollments, guides, allSessions, offers, upcomingLessons] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.courseEnrollment.findMany({
      where: { userId },
      include: { edition: { include: { course: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    getUserGuides(userId),
    getUserSessions(userId),
    prisma.personalizedOffer.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.lesson.findMany({
      where: {
        edition: { enrollments: { some: { userId } } },
        availableFrom: { not: null },
      },
      include: { edition: { include: { course: { select: { title: true, slug: true } } } } },
      orderBy: { availableFrom: 'asc' },
    }),
  ])

  if (!user) redirect('/logare')

  const upcomingSessions = allSessions.filter(
    (s) => s.status === 'BOOKED' && s.scheduledAt > new Date()
  )

  // Serialize dates for client component
  const serializedEnrollments = enrollments.map((e) => ({
    id: e.id,
    accessExpiresAt: e.accessExpiresAt.toISOString(),
    edition: {
      editionNumber: e.edition.editionNumber,
      course: { title: e.edition.course.title, slug: e.edition.course.slug },
    },
  }))

  const serializedGuides = guides.map((g) => ({
    id: g.id,
    title: g.title,
    slug: g.slug,
    coverImage: g.coverImage,
  }))

  const serializedSessions = upcomingSessions.map((s) => ({
    id: s.id,
    scheduledAt: s.scheduledAt.toISOString(),
    duration: s.duration,
    status: s.status,
    zoomLink: s.zoomLink,
  }))

  const serializedOffers = offers.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    linkUrl: o.linkUrl,
    linkLabel: o.linkLabel,
    validUntil: o.validUntil?.toISOString() ?? null,
  }))

  const serializedLessons = upcomingLessons.map((l) => ({
    id: l.id,
    title: l.title,
    duration: l.duration,
    availableFrom: l.availableFrom?.toISOString() ?? null,
    zoomLink: l.zoomLink,
    videoKey: l.videoKey,
    courseTitle: l.edition.course.title,
    courseSlug: l.edition.course.slug,
    editionId: l.editionId,
  }))

  return (
    <>
      <Navbar />

      {/* Hero Header */}
      <section style={{
        backgroundImage: 'linear-gradient(#51087e, #a62bf1)',
        padding: '60px 5%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
      }}>
        <div style={{ maxWidth: '940px', width: '100%' }}>
          <h1 style={{
            backgroundImage: 'linear-gradient(90deg, white, #e0e0e0)',
            WebkitTextFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            fontWeight: 700,
            margin: 0,
          }}>
            Bun venit, {user.name || user.email}!
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0.5rem 0 0' }}>
            Iată ce ai la dispoziție.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px' }}>
            {[
              { value: enrollments.length, label: 'cursuri' },
              { value: guides.length, label: 'ghiduri' },
              { value: upcomingSessions.length, label: 'sesiuni' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '999px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  color: '#ffffff',
                }}
              >
                {stat.value} {stat.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <DashboardTabs
        enrollments={serializedEnrollments}
        guides={serializedGuides}
        upcomingSessions={serializedSessions}
        offers={serializedOffers}
        lessons={serializedLessons}
      />

      <Footer />
    </>
  )
}
