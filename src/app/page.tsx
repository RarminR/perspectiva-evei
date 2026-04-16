import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/ui/Navbar'
import { CountUp } from '@/components/ui/CountUp'
import { FadeIn } from '@/components/ui/FadeIn'
import { Footer } from '@/components/ui/Footer'
import { COURSE_PRICING, PRICING_FEATURES } from '@/lib/constants/pricing'
import { getCourseWithEditions } from '@/services/course'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Acasă | Perspectiva Evei',
  description:
    'Descoperă cum să devii Creatorul realității tale prin cursuri, ghiduri și sesiuni 1 la 1. Manifestare conștientă și schimbare autentică cu Eva.',
  openGraph: {
    title: 'Acasă | Perspectiva Evei',
    description:
      'Descoperă cum să devii Creatorul realității tale prin cursuri, ghiduri și sesiuni 1 la 1.',
    url: 'https://perspectivaevei.com',
    siteName: 'Perspectiva Evei',
    locale: 'ro_RO',
    type: 'website',
  },
}

const StarSVG = () => (
  <svg
    width="18"
    height="17"
    viewBox="0 0 18 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.16379 0.551109C8.47316 -0.183704 9.52684 -0.183703 9.83621 0.551111L11.6621 4.88811C11.7926 5.19789 12.0875 5.40955 12.426 5.43636L17.1654 5.81173C17.9684 5.87533 18.294 6.86532 17.6822 7.38306L14.0713 10.4388C13.8134 10.6571 13.7007 10.9996 13.7795 11.3259L14.8827 15.8949C15.0696 16.669 14.2172 17.2809 13.5297 16.8661L9.47208 14.4176C9.18225 14.2427 8.81775 14.2427 8.52793 14.4176L4.47029 16.8661C3.7828 17.2809 2.93036 16.669 3.11727 15.8949L4.22048 11.3259C4.29928 10.9996 4.18664 10.6571 3.92873 10.4388L0.317756 7.38306C-0.294046 6.86532 0.0315611 5.87533 0.834562 5.81173L5.57402 5.43636C5.91255 5.40955 6.20744 5.19789 6.33786 4.88811L8.16379 0.551109Z"
      fill="currentColor"
    />
  </svg>
)

const testimonials = [
  {
    quote:
      'Am venit în curs confuză și blocată. În câteva săptămâni am învățat să-mi schimb complet raportarea și să aleg conștient ce trăiesc.',
    name: 'Roxana M.',
    role: 'Antreprenoare',
  },
  {
    quote:
      'Cel mai valoros lucru pentru mine a fost claritatea. Nu mai alerg după tehnici, ci îmi asum postura de creator în fiecare zi.',
    name: 'Loredana P.',
    role: 'Manager HR',
  },
  {
    quote:
      'Fiecare sesiune a fost practică, aplicată și directă. Rezultatele au apărut atât în relații, cât și în felul în care mă văd pe mine.',
    name: 'Andreea C.',
    role: 'Consultant',
  },
]

const courseBenefits = [
  'Înțelegi cum și de ce trăiești realitatea actuală',
  'Deprinzi un nou mod de gândire - unul favorabil ție',
  'Te bucuri de o nouă realitate - una creată conștient',
  'Ești susținut constant, pe tot parcursul procesului',
]

const socialProofStats = [
  { value: '1000+', label: 'ore de coaching' },
  { value: '4', label: 'ani de experiență' },
  { value: '11', label: 'ediții de succes' },
  { value: '0', label: 'teme, meditații sau afirmații' },
]

const formatEur = (value: number) =>
  new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)

export default async function Home() {
  const course = await getCourseWithEditions('cursul-ado')
  const activeEdition = course?.editions?.find((e) => e.enrollmentOpen)

  let guides: {
    id: string
    title: string
    slug: string
    price: number
    coverImage: string | null
  }[] = []
  try {
    guides = await prisma.guide.findMany({
      where: {},
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true, slug: true, price: true, coverImage: true },
    })
  } catch {}

  let bundle: { id: string; title: string; price: number; originalPrice: number; items: { guide: { title: string } }[] } | null = null
  try {
    bundle = await prisma.bundle.findFirst({
      where: { active: true },
      select: { id: true, title: true, price: true, originalPrice: true, items: { include: { guide: { select: { title: true } } } } },
    })
  } catch {}

  const session = await auth()
  const userId = session?.user?.id

  let ownedGuideIds: Set<string> = new Set()
  if (userId) {
    try {
      const access = await prisma.guideAccess.findMany({
        where: { userId },
        select: { guideId: true },
      })
      ownedGuideIds = new Set(access.map((a) => a.guideId))
    } catch {}
  }

  const displayedGuides = guides

  return (
    <main>
      <Navbar />

      <section
        style={{
          backgroundImage:
            "linear-gradient(101deg, #a007dc, rgba(62,6,97,0.75) 30%, rgba(62,6,97,0.5) 55%, transparent 69%), url('/images/IMG_7501.jpg')",
          backgroundPosition: '0 0, 50%',
          backgroundSize: 'auto, cover',
          justifyContent: 'center',
          alignItems: 'center',
          height: '90vh',
          display: 'flex',
        }}
      >
        <div style={{ maxWidth: '940px', width: '100%', margin: '0 auto', padding: '0 30px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '22px',
              alignItems: 'flex-start',
              width: '50%',
              color: '#f8f9fa',
            }}
            className="w-full md:w-1/2"
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  borderRadius: '999px',
                  padding: '.75rem 1.5rem',
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ color: '#a007dc' }}>●</span>
                <span>Locuri restrânse</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  borderRadius: '999px',
                  padding: '.75rem 1.5rem',
                  fontSize: '0.9rem',
                }}
              >
                <span>Ediția 12: 9 iunie - 28 iulie</span>
              </div>
            </div>

            <h1
              style={{
                backgroundImage: 'linear-gradient(90deg, #ffffff, #e8c2ff)',
                WebkitTextFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                lineHeight: 1.1,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Un nou „TU” în doar 8 săptămâni.
            </h1>

            <p style={{ color: '#ffffff', maxWidth: '480px', margin: 0, lineHeight: 1.65 }}>
              Cursul A.D.O.! este locul în care perspectiva ta se schimbă complet. Fără tehnici.
              Fără meditații. Fără teme. Doar tu, într-o postură complet nouă - cea a centrului
              realității tale.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
              <Link
                href="/checkout?product=COURSE&type=full"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#51087e',
                  border: '1px solid #ffffff',
                  borderRadius: '999px',
                  padding: '.85rem 1.7rem',
                  textDecoration: 'none',
                  fontWeight: 700,
                  display: 'inline-flex',
                }}
              >
                Înscrie-te acum!
              </Link>
              <Link
                href="#produs"
                style={{
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid #ffffff',
                  borderRadius: '999px',
                  padding: '.85rem 1.7rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'inline-flex',
                }}
              >
                Vezi ce include – Află mai multe
              </Link>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              sau 2 × {COURSE_PRICING.INSTALLMENT_PRICE} în rate
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.72)' }}>
              {activeEdition ? 'Înscrieri deschise acum pentru ediția curentă.' : 'Edițiile sunt anunțate periodic.'}
            </p>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: '#51087e', padding: '20px 30px' }}>
        <div style={{ maxWidth: '940px', width: '100%', margin: '0 auto' }}>
          <div className="hidden md:flex" style={{ justifyContent: 'space-between', gap: '20px' }}>
            {socialProofStats.map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>
                  <CountUp value={stat.value} />
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div
            className="grid grid-cols-2 gap-6 md:hidden"
            style={{ justifyContent: 'space-between' }}
          >
            {socialProofStats.map((stat) => (
              <div key={`mobile-${stat.label}`} style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>
                  <CountUp value={stat.value} />
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="produs"
        style={{
          backgroundImage: 'linear-gradient(180deg, #ffffff, #e8c2ff)',
          padding: '90px 30px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: '940px', width: '100%', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px',
              marginBottom: '40px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                backgroundImage: 'linear-gradient(90deg, #51087e, #a007dc)',
                WebkitTextFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}
            >
              De ce A.D.O.!?
            </h2>
            <p style={{ margin: 0, color: '#2c0246', fontStyle: 'italic', maxWidth: '640px' }}>
              „Schimbă-ți percepția despre tine și vei schimba automat și lumea în care trăiești.” — Neville Goddard
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {courseBenefits.map((benefit, index) => (
                <FadeIn key={benefit} delay={index * 120}>
                  <div
                    style={{
                      backgroundColor: 'rgba(81,8,126,0.15)',
                      borderRadius: '20px',
                      padding: '30px',
                      display: 'flex',
                      gap: '20px',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '58px',
                        height: '58px',
                        minWidth: '58px',
                        borderRadius: '14px',
                        backgroundColor: '#ffffff',
                        color: '#51087e',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 12px 28px rgba(81,8,126,0.35)',
                        fontSize: '24px',
                      }}
                    >
                      ✦
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        lineHeight: 1.2,
                        backgroundImage: 'linear-gradient(90deg, #51087e, #a007dc)',
                        WebkitTextFillColor: 'transparent',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                      }}
                    >
                      {benefit}
                    </h3>
                  </div>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={200}>
              <div
                style={{
                  backgroundColor: '#51087e',
                  borderRadius: '30px',
                  padding: '40px',
                  color: '#f8f9fa',
                  position: 'relative',
                  overflow: 'hidden',
                  height: '100%',
                }}
              >
              <div
                style={{
                  position: 'absolute',
                  width: '190px',
                  height: '190px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(160,7,220,0.35)',
                  filter: 'blur(42px)',
                  top: '-70px',
                  right: '-20px',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '140px',
                  height: '140px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(232,194,255,0.25)',
                  filter: 'blur(36px)',
                  bottom: '-40px',
                  left: '-20px',
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    border: '1px solid rgba(255,255,255,0.35)',
                    borderRadius: '999px',
                    padding: '.5rem 1rem',
                    fontSize: '0.8rem',
                    marginBottom: '18px',
                  }}
                >
                  Plată integrală
                </div>

                <p style={{ margin: 0, fontSize: '2.8rem', fontWeight: 700 }}>{COURSE_PRICING.FULL_PRICE}</p>
                <p
                  style={{
                    margin: '4px 0 10px',
                    color: 'rgba(255,255,255,0.72)',
                    textDecoration: 'line-through',
                  }}
                >
                  {COURSE_PRICING.FULL_PRICE_CROSSED}
                </p>
                <div
                  style={{
                    display: 'inline-flex',
                    backgroundColor: 'rgba(232,194,255,0.25)',
                    color: '#ffffff',
                    borderRadius: '999px',
                    padding: '.4rem .9rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Economisești {COURSE_PRICING.SAVINGS_PERCENT}
                </div>

                <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '24px 0' }} />

                <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)' }}>
                  sau 2 × {COURSE_PRICING.INSTALLMENT_PRICE} ({COURSE_PRICING.INSTALLMENT_TOTAL} total)
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                  {PRICING_FEATURES.slice(0, 3).map((feature) => (
                    <div key={feature} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#e8c2ff' }}>✓</span>
                      <span style={{ fontSize: '0.95rem' }}>{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/checkout?product=COURSE&type=full"
                  style={{
                    marginTop: '24px',
                    width: '100%',
                    display: 'inline-flex',
                    justifyContent: 'center',
                    backgroundColor: '#a007dc',
                    color: '#ffffff',
                    borderRadius: '999px',
                    padding: '.9rem 1.3rem',
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  Cumpără acum →
                </Link>

                <p style={{ margin: '12px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
                  Doar {COURSE_PRICING.MAX_PARTICIPANTS} locuri per ediție
                </p>
              </div>
            </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section
        style={{
          backgroundImage: 'linear-gradient(180deg, #e8c2ff, #ffffff)',
          padding: '90px 30px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: '940px', width: '100%', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px',
              marginBottom: '40px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                backgroundImage: 'linear-gradient(90deg, #51087e, #a007dc)',
                WebkitTextFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}
            >
              Ce spun cursanții mei
            </h2>
          </div>

          <div
            style={{ display: 'grid', gap: '30px' }}
            className="grid-cols-1 md:grid-cols-3"
          >
            {testimonials.map((item, index) => (
              <FadeIn key={item.name} delay={index * 150}>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    padding: '30px',
                    boxShadow: '0 16px 30px rgba(81,8,126,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    height: '100%',
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px', color: '#f59e0b' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <StarSVG key={i} />
                    ))}
                  </div>
                  <p style={{ margin: 0, color: '#2c0246', fontStyle: 'italic', lineHeight: 1.65 }}>
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <div style={{ borderTop: '1px solid rgba(81,8,126,0.16)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '999px',
                          backgroundImage: 'linear-gradient(135deg, #51087e, #a007dc)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                        }}
                      >
                        {item.name[0]}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: '#2c0246' }}>{item.name}</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#6f5a81' }}>{item.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>


        </div>
      </section>

      <section
        style={{
          backgroundImage: 'linear-gradient(180deg, #ffffff, #e8c2ff)',
          padding: '90px 30px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: '940px', width: '100%', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px',
              marginBottom: '40px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                backgroundImage: 'linear-gradient(90deg, #51087e, #a007dc)',
                WebkitTextFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}
            >
              Explorează mai multe resurse
            </h2>
            <p style={{ margin: 0, color: '#2c0246' }}>
              …și alege-o pe cea mai potrivită pentru tine!
            </p>
          </div>

          {/* Guides (left) + Bundle & Sessions (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ alignItems: 'stretch' }}>
            {/* Left: 3 guides stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              {displayedGuides.length > 0 ? (
                displayedGuides.map((guide) => (
                  <div
                    key={guide.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '24px',
                      padding: '16px',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center',
                      boxShadow: '0 12px 24px rgba(81,8,126,0.1)',
                      flex: 1,
                    }}
                  >
                    <div style={{ borderRadius: '16px', overflow: 'hidden', width: '80px', height: '112px', minWidth: '80px' }}>
                      <Image
                        src={guide.coverImage || '/images/Cine-manifesta.png'}
                        alt={guide.title}
                        width={80}
                        height={112}
                        unoptimized
                        style={{ width: '80px', height: '112px', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ margin: 0, fontWeight: 700, color: '#2c0246', fontSize: '1.05rem' }}>
                        {guide.title}
                      </p>
                      <p style={{ margin: 0, color: '#51087e' }}>{formatEur(guide.price)}</p>
                      {ownedGuideIds.has(guide.id) ? (
                        <Link
                          href={`/ghidurile-mele/${guide.slug}`}
                          style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 700 }}
                        >
                          Mergi la ghid →
                        </Link>
                      ) : (
                        <Link
                          href={`/checkout?product=GUIDE&id=${guide.id}`}
                          style={{ color: '#a007dc', textDecoration: 'none', fontWeight: 700 }}
                        >
                          Cumpără →
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '24px',
                    padding: '28px',
                    color: '#2c0246',
                    boxShadow: '0 12px 24px rgba(81,8,126,0.1)',
                  }}
                >
                  Ghidurile sunt în curs de actualizare. Revino în scurt timp pentru noile resurse.
                </div>
              )}
            </div>

            {/* Right: Bundle + Sessions stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              {bundle ? (
                <div
                  style={{
                    backgroundColor: '#51087e',
                    borderRadius: '24px',
                    padding: '24px',
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Pachet promoțional activ</p>
                  <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{bundle.title}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                    {bundle.items.map((item) => item.guide.title).join(' + ')}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', margin: 0 }}>
                    <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>{formatEur(bundle.price)}</p>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through', fontSize: '1.1rem' }}>
                      {formatEur(bundle.originalPrice)}
                    </p>
                  </div>
                  <Link
                    href={`/checkout?product=BUNDLE&id=${bundle.id}`}
                    style={{
                      marginTop: '8px',
                      width: 'fit-content',
                      backgroundColor: '#a007dc',
                      borderRadius: '999px',
                      padding: '.7rem 1.3rem',
                      textDecoration: 'none',
                      color: '#ffffff',
                      fontWeight: 700,
                    }}
                  >
                    Cumpără pachetul →
                  </Link>
                </div>
              ) : null}

              <div
                style={{
                  borderRadius: '30px',
                  overflow: 'hidden',
                  minHeight: '280px',
                  display: 'flex',
                  flex: 1,
                  alignItems: 'flex-end',
                  backgroundImage:
                    "linear-gradient(180deg, rgba(44,2,70,0.2), rgba(44,2,70,0.85)), url('/images/IMG_6167-min_1.jpeg')",
                  backgroundPosition: '50%',
                  backgroundSize: 'cover',
                }}
              >
                <div style={{ padding: '30px', color: '#ffffff', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Image
                    src="/images/poza-eva-hero.png"
                    alt="Eva"
                    width={56}
                    height={56}
                    style={{ borderRadius: '999px', border: '2px solid rgba(255,255,255,0.6)' }}
                  />
                  <h3 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 700 }}>Ședințe 1:1</h3>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                    O sesiune directă pentru blocajele tale actuale, cu claritate, structură și pași aplicabili.
                  </p>
                  <Link
                    href="/sedinte-1-la-1"
                    style={{
                      width: 'fit-content',
                      border: '1px solid #ffffff',
                      borderRadius: '999px',
                      color: '#ffffff',
                      textDecoration: 'none',
                      padding: '.75rem 1.2rem',
                      fontWeight: 600,
                    }}
                  >
                    Programează o sesiune
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          backgroundImage:
            "linear-gradient(rgba(81,8,126,0.45), rgba(81,8,126,0.45)), linear-gradient(transparent, #51087e), url('/images/IMG_6166-min_1.avif')",
          backgroundPosition: '0 0, 0 0, 50%',
          backgroundSize: 'auto, auto, cover',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '110px 30px',
        }}
      >
        <div
          style={{
            maxWidth: '940px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 'clamp(2rem, 4.5vw, 3.4rem)',
              fontWeight: 700,
              backgroundImage: 'linear-gradient(90deg, #ffffff, #e8c2ff)',
              WebkitTextFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }}
          >
            Ești gata să trăiești o nouă realitate?
          </h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '1.2rem', fontWeight: 500 }}>
            Eu sunt aici pentru tine!
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
            <Link
              href="/checkout?product=COURSE&type=full"
              style={{
                borderRadius: '999px',
                backgroundColor: '#ffffff',
                color: '#51087e',
                textDecoration: 'none',
                padding: '.85rem 1.8rem',
                fontWeight: 700,
                border: '1px solid #ffffff',
              }}
            >
              Înscrie-te la A.D.O.!
            </Link>
            <Link
              href="/sedinte-1-la-1"
              style={{
                borderRadius: '999px',
                backgroundColor: 'transparent',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '.85rem 1.8rem',
                fontWeight: 700,
                border: '1px solid #ffffff',
              }}
            >
              Programează ședință individuală
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
