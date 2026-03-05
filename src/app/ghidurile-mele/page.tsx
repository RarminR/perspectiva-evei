import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'

export const dynamic = 'force-dynamic'

export default async function GhidurileMelePage() {
  const session = await auth()
  if (!session?.user) redirect('/logare')

  const userId = (session.user as any).id

  const guideAccesses = await prisma.guideAccess.findMany({
    where: { userId },
    include: { guide: true },
    orderBy: { grantedAt: 'desc' },
  })

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
            Ghidurile mele
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.5rem' }}>
            Ghidurile tale achiziționate
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ backgroundImage: 'linear-gradient(180deg, white, #e8c2ff)', padding: '60px 5%', display: 'flex', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ maxWidth: '940px', width: '100%' }}>
          {guideAccesses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '1.5rem' }}>Nu ai achiziționat niciun ghid.</p>
              <Link href="/ghiduri" style={{
                backgroundColor: '#51087e',
                border: '1px solid #51087e',
                borderRadius: '999px',
                color: '#f8f9fa',
                padding: '.75rem 2rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                fontWeight: 600,
              }}>
                Explorează ghidurile
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {guideAccesses.map(({ guide }: any) => (
                <Link
                  key={guide.id}
                  href={`/ghidurile-mele/${guide.slug}`}
                  style={{
                    backgroundColor: '#51087e',
                    borderRadius: '40px',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    display: 'block',
                    transition: 'all .2s',
                  }}
                >
                  {guide.coverImage && (
                    <div style={{ position: 'relative', height: '200px', backgroundImage: `linear-gradient(180deg, transparent 50%, #51087e), url(${guide.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  )}
                  {!guide.coverImage && (
                    <div style={{ height: '200px', backgroundImage: 'linear-gradient(180deg, #51087e, #a007dc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
                      📖
                    </div>
                  )}
                  <div style={{ backgroundImage: 'linear-gradient(180deg, #51087e, #a007dc)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>{guide.title}</h2>
                    {guide.description && (
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.5 }}>{guide.description}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', fontWeight: 600 }}>Citeste →</span>
                      {guide.audioKey && (
                        <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '999px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', color: 'white' }}>
                          🎧 Audiobook
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}
