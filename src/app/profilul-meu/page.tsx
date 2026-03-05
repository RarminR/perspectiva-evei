import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { ProfileForm } from './components/ProfileForm'
import { DeviceList } from './components/DeviceList'

export const dynamic = 'force-dynamic'

export default async function ProfilulMeuPage() {
  const session = await auth()
  if (!session?.user) redirect('/logare')

  const userId = (session.user as any).id

  const [user, devices, enrollments, guideAccesses, orders] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.device.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.courseEnrollment.findMany({
      where: { userId },
      include: { edition: { include: { course: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.guideAccess.findMany({
      where: { userId },
      include: { guide: true },
      orderBy: { grantedAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  if (!user) redirect('/logare')

  const sectionStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 20px rgba(81,8,126,0.08)',
  }

  const sectionHeadingStyle: React.CSSProperties = {
    color: '#51087e',
    fontSize: '1.1rem',
    fontWeight: 700,
    marginBottom: '1rem',
  }

  const listItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(81,8,126,0.06)',
    borderRadius: '12px',
    marginBottom: '0.5rem',
  }

  return (
    <>
      <Navbar />

      {/* Hero */}
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
          }}>
            Profilul meu
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.5rem' }}>
            Bine ai venit, {user.name || user.email}!
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ backgroundImage: 'linear-gradient(180deg, white, #e8c2ff)', padding: '60px 5%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '940px', width: '100%' }}>

          {/* Profile section */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Informatii personale</h2>
            <ProfileForm
              user={{
                id: user.id,
                name: user.name ?? '',
                email: user.email,
                phone: user.phone ?? '',
              }}
            />
          </div>

          {/* Devices section */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Dispozitivele mele</h2>
            <DeviceList devices={devices} />
          </div>

          {/* Course enrollments */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Cursurile mele</h2>
            {enrollments.length === 0 ? (
              <p style={{ color: '#666' }}>Nu esti inscris la niciun curs.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {enrollments.map((e) => (
                  <li key={e.id} style={listItemStyle}>
                    <div>
                      <p style={{ fontWeight: 600, color: '#51087e', marginBottom: '0.2rem' }}>
                        {e.edition.course.title}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#666' }}>
                        Editia {e.edition.editionNumber} · Acces pana la{' '}
                        {new Date(e.accessExpiresAt).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                    <a href={`/curs/${e.edition.course.slug}`} style={{ color: '#a007dc', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
                      Acceseaza →
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Guide accesses */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Ghidurile mele</h2>
            {guideAccesses.length === 0 ? (
              <p style={{ color: '#666' }}>Nu ai achizitionat niciun ghid.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {guideAccesses.map((ga) => (
                  <li key={ga.id} style={listItemStyle}>
                    <p style={{ fontWeight: 600, color: '#51087e' }}>{ga.guide.title}</p>
                    <a href={`/ghidurile-mele/${ga.guide.slug}`} style={{ color: '#a007dc', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
                      Citeste →
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Order history */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Istoricul comenzilor</h2>
            {orders.length === 0 ? (
              <p style={{ color: '#666' }}>Nu ai nicio comanda.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e8c2ff', textAlign: 'left' }}>
                      <th style={{ paddingBottom: '0.75rem', fontWeight: 600, color: '#666' }}>Data</th>
                      <th style={{ paddingBottom: '0.75rem', fontWeight: 600, color: '#666' }}>Suma</th>
                      <th style={{ paddingBottom: '0.75rem', fontWeight: 600, color: '#666' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} style={{ borderBottom: '1px solid rgba(81,8,126,0.08)' }}>
                        <td style={{ padding: '0.75rem 0', color: '#444' }}>
                          {new Date(o.createdAt).toLocaleDateString('ro-RO')}
                        </td>
                        <td style={{ padding: '0.75rem 0', color: '#222', fontWeight: 600 }}>
                          &euro;{o.totalAmount.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem 0' }}>
                          <span style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            backgroundColor: o.status === 'COMPLETED' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                            color: o.status === 'COMPLETED' ? '#16a34a' : '#d97706',
                          }}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </section>

      <Footer />
    </>
  )
}
