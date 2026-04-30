import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { imgSrc } from '@/lib/image'

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {guideAccesses.map(({ guide }: any) => (
                <Link
                  key={guide.id}
                  href={`/ghidurile-mele/${guide.slug}`}
                  className="group relative flex flex-col rounded-[24px] overflow-hidden shadow-[0_20px_40px_rgba(81,8,126,0.15)] hover:shadow-[0_28px_56px_rgba(81,8,126,0.25)] hover:-translate-y-1 transition-all duration-300 no-underline text-white"
                  style={{
                    backgroundImage:
                      'linear-gradient(180deg, #e8c2ff 0%, #a62bf1 38%, #51087e 72%, #2c0246 100%)',
                  }}
                >
                  {/* Floating cover */}
                  <div className="relative flex items-center justify-center pt-10 pb-6 px-8">
                    <div className="relative aspect-[3/4] w-[65%] drop-shadow-[0_18px_30px_rgba(44,2,70,0.45)] group-hover:scale-[1.03] transition-transform duration-500">
                      {guide.coverImage ? (
                        <Image
                          src={imgSrc(guide.coverImage)}
                          alt={guide.title}
                          fill
                          unoptimized
                          className="object-contain"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
                          📖
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col px-7 pb-7 gap-3 text-left">
                    {guide.type === 'AUDIO' && (
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white">
                          🎧 Audiobook
                        </span>
                      </div>
                    )}
                    <h2 className="text-2xl font-bold leading-tight text-white">
                      {guide.title}
                    </h2>
                    {guide.description && (
                      <p className="text-[0.95rem] leading-relaxed text-white/80 line-clamp-3">
                        {guide.description}
                      </p>
                    )}
                    <div className="mt-auto pt-4">
                      <span
                        className="inline-flex items-center justify-between w-full gap-2 border font-semibold py-3 px-5 rounded-full text-white group-hover:bg-white/10 transition-colors duration-200"
                        style={{ borderColor: 'rgba(255,255,255,0.5)' }}
                      >
                        {guide.type === 'AUDIO' ? 'Ascultă' : 'Citește'}
                        <span aria-hidden>→</span>
                      </span>
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
