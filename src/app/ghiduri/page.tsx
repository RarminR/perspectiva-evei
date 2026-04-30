import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar, Footer, Section } from '@/components/ui'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { imgSrc } from '@/lib/image'

export const metadata: Metadata = {
  title: 'Ghiduri de Manifestare | Perspectiva Evei',
  description:
    'Ghiduri digitale de manifestare conștientă create de Eva Popescu. Pași clari spre transformare autentică.',
  openGraph: {
    title: 'Ghiduri de Manifestare | Perspectiva Evei',
    description:
      'Ghiduri digitale de manifestare conștientă create de Eva Popescu.',
    url: 'https://perspectivaevei.com/ghiduri',
    siteName: 'Perspectiva Evei',
    locale: 'ro_RO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ghiduri de Manifestare | Perspectiva Evei',
    description:
      'Ghiduri digitale de manifestare conștientă create de Eva Popescu.',
  },
}

const FALLBACK_GUIDES: GuideData[] = [
  {
    id: '1',
    title: 'Cine Manifestă?!',
    slug: 'cine-manifesta',
    price: 99,
    description: 'Ghidul care îți dezvăluie secretele manifestării conștiente.',
    coverImage: null,
    type: 'PDF',
  },
  {
    id: '2',
    title: 'Ghidul Abundenței',
    slug: 'ghidul-abundentei',
    price: 99,
    description: 'Transformă-ți relația cu banii și abundența.',
    coverImage: null,
    type: 'PDF',
  },
  {
    id: '3',
    title: 'Ghidul Relațiilor',
    slug: 'ghidul-relatiilor',
    price: 99,
    description: 'Manifestă relații sănătoase și iubitoare.',
    coverImage: null,
    type: 'PDF',
  },
]

const BUNDLE_PRICE = 82.5
const BUNDLE_ORIGINAL = 110

interface GuideData {
  id: string
  title: string
  slug: string
  price: number
  description: string | null
  coverImage: string | null
  type: 'PDF' | 'AUDIO'
}

async function getGuides(): Promise<GuideData[]> {
  try {
    const guides = await prisma.guide.findMany({
      where: {},
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        description: true,
        coverImage: true,
        type: true,
      },
    })
    return guides.length > 0 ? guides : FALLBACK_GUIDES
  } catch {
    return FALLBACK_GUIDES
  }
}

async function getOwnedGuideIds(userId: string | null): Promise<Set<string>> {
  if (!userId) return new Set()
  try {
    const access = await prisma.guideAccess.findMany({
      where: { userId },
      select: { guideId: true },
    })
    return new Set(access.map((a) => a.guideId))
  } catch {
    return new Set()
  }
}

interface BundleData {
  id: string
  title: string
  slug: string
  price: number
  originalPrice: number
  items: { guide: { id: string; title: string; slug: string } }[]
}

async function getBundle(): Promise<BundleData | null> {
  try {
    const bundle = await prisma.bundle.findFirst({
      where: { active: true },
      include: {
        items: {
          include: {
            guide: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    })
    return bundle
  } catch {
    return null
  }
}

export default async function GhiduriPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id ?? null

  const [guides, bundle, ownedGuideIds] = await Promise.all([
    getGuides(),
    getBundle(),
    getOwnedGuideIds(userId),
  ])

  const bundlePrice = bundle?.price ?? BUNDLE_PRICE
  const bundleOriginal = bundle?.originalPrice ?? BUNDLE_ORIGINAL
  const bundleSavings = bundleOriginal - bundlePrice

  return (
    <>
      <Navbar />
      {/* Hero Section */}
      <section style={{
        backgroundImage: 'linear-gradient(#51087e, #a62bf1)',
        padding: '100px 5%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '940px', width: '100%' }}>
          <h1 style={{
            backgroundImage: 'linear-gradient(90deg, white, #e0e0e0)',
            WebkitTextFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            marginBottom: '1rem',
          }}>
            Ghiduri
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Ghiduri create pentru a te ajuta să preiei controlul asupra vieții tale, pas cu pas.
          </p>
        </div>
      </section>

      {/* Guide Cards Grid */}
      <Section variant="default">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#51087e] mb-3">
            Explorează ghidurile mele
          </h2>
          <p className="text-[#51087e]/70 text-lg max-w-xl mx-auto">
            Ghiduri create pentru a te ajuta să preiei controlul asupra vieții tale, pas cu pas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          {guides.map((guide) => {
            const isBeginner = guide.slug === 'ghid-de-schimbare-al-conceptului-de-sine'
            const owned = ownedGuideIds.has(guide.id)
            const ownedCtaLabel = guide.type === 'AUDIO' ? 'Ascultă' : 'Citește'
            return (
              <div
                key={guide.id}
                className="group relative flex flex-col rounded-[24px] overflow-hidden shadow-[0_20px_40px_rgba(81,8,126,0.15)] hover:shadow-[0_28px_56px_rgba(81,8,126,0.25)] hover:-translate-y-1 transition-all duration-300 text-white"
                style={{
                  backgroundImage: 'linear-gradient(180deg, #e8c2ff 0%, #a62bf1 38%, #51087e 72%, #2c0246 100%)',
                }}
              >
                {isBeginner && (
                  <div className="absolute top-5 left-5 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur text-[#51087e] text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                      <span className="text-[#a007dc]">✦</span>
                      Ghid pentru începători
                    </span>
                  </div>
                )}

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

                {/* Content */}
                <div className="flex-1 flex flex-col px-7 pb-7 gap-3 text-left">
                  <div>
                    <span
                      className="inline-flex items-center gap-2 text-sm font-bold px-4 py-1.5 rounded-full shadow-md text-white"
                      style={{
                        backgroundImage: 'linear-gradient(90deg, #a007dc, #e0b0ff)',
                      }}
                    >
                      <span className="text-xs">✦</span>€{guide.price}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold leading-tight mt-1 text-white">
                    {guide.title}
                  </h3>
                  {guide.description && (
                    <p className="text-[0.95rem] leading-relaxed text-white/80">
                      {guide.description}
                    </p>
                  )}
                  <div className="mt-auto pt-4 flex flex-col sm:flex-row gap-3">
                    {owned ? (
                      <Link
                        href={`/ghidurile-mele/${guide.slug}`}
                        className="inline-flex items-center justify-center w-full gap-2 font-semibold py-3 px-5 rounded-full text-[#51087e] bg-white hover:bg-[#f3e8ff] transition-colors duration-200 no-underline"
                      >
                        {ownedCtaLabel}
                        <span aria-hidden>→</span>
                      </Link>
                    ) : (
                      <>
                        <Link
                          href={`/ghiduri/${guide.slug}`}
                          className="inline-flex items-center justify-center flex-1 gap-2 border font-semibold py-3 px-5 rounded-full text-white hover:bg-white/10 transition-colors duration-200 no-underline"
                          style={{ borderColor: 'rgba(255,255,255,0.5)' }}
                        >
                          Află mai mult
                        </Link>
                        <Link
                          href={`/checkout?product=GUIDE&id=${guide.id}`}
                          className="inline-flex items-center justify-center flex-1 gap-2 font-semibold py-3 px-5 rounded-full text-[#51087e] bg-white hover:bg-[#f3e8ff] transition-colors duration-200 no-underline"
                        >
                          Cumpără acum
                          <span aria-hidden>→</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Bundle — matching card style */}
          {bundle && (
            <Link
              href={`/checkout?product=BUNDLE&id=${bundle.id}`}
              className="group relative flex flex-col rounded-[24px] overflow-hidden shadow-[0_20px_40px_rgba(81,8,126,0.15)] hover:shadow-[0_28px_56px_rgba(81,8,126,0.25)] hover:-translate-y-1 transition-all duration-300 no-underline text-white"
              style={{
                backgroundImage: 'linear-gradient(180deg, #e8c2ff 0%, #a62bf1 38%, #51087e 72%, #2c0246 100%)',
              }}
            >
              <div className="relative flex items-center justify-center pt-10 pb-6 px-8">
                <div className="relative aspect-[3/4] w-[65%] drop-shadow-[0_18px_30px_rgba(44,2,70,0.45)] group-hover:scale-[1.03] transition-transform duration-500">
                  <Image
                    src="/images/bundle-covers.jpg"
                    alt={bundle.title ?? 'Pachet promoțional'}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col px-7 pb-7 gap-3 text-left">
                <div>
                  <span
                    className="inline-flex items-center gap-2 text-sm font-bold px-4 py-1.5 rounded-full shadow-md text-white"
                    style={{ backgroundImage: 'linear-gradient(90deg, #a007dc, #e0b0ff)' }}
                  >
                    <span className="text-xs">✦</span>
                    <span className="text-xs line-through opacity-70">€{bundleOriginal}</span>
                    <span>€{bundlePrice}</span>
                  </span>
                </div>
                <h3 className="text-2xl font-bold leading-tight mt-1 text-white">
                  {bundle.title ?? 'Pachet promoțional'}
                </h3>
                <p className="text-[0.95rem] leading-relaxed text-white/80">
                  {bundle.items && bundle.items.length > 0
                    ? bundle.items.map((item) => item.guide.title).join(' + ')
                    : 'Toate ghidurile într-un singur pachet.'}
                </p>
                <p className="text-xs font-semibold text-white/70">
                  Economisești €{bundleSavings}
                </p>
                <div className="mt-auto pt-4">
                  <span
                    className="inline-flex items-center justify-between w-full gap-2 border font-semibold py-3 px-5 rounded-full text-white"
                    style={{ borderColor: 'rgba(255,255,255,0.5)' }}
                  >
                    Cumpără Pachetul
                    <span aria-hidden>→</span>
                  </span>
                </div>
              </div>
            </Link>
          )}
        </div>
      </Section>

      <Footer />
    </>
  )
}
