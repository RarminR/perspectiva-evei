import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar, Footer, Section } from '@/components/ui'
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

const FALLBACK_GUIDES = [
  {
    id: '1',
    title: 'Cine Manifestă?!',
    slug: 'cine-manifesta',
    price: 99,
    description: 'Ghidul care îți dezvăluie secretele manifestării conștiente.',
    coverImage: null,
  },
  {
    id: '2',
    title: 'Ghidul Abundenței',
    slug: 'ghidul-abundentei',
    price: 99,
    description: 'Transformă-ți relația cu banii și abundența.',
    coverImage: null,
  },
  {
    id: '3',
    title: 'Ghidul Relațiilor',
    slug: 'ghidul-relatiilor',
    price: 99,
    description: 'Manifestă relații sănătoase și iubitoare.',
    coverImage: null,
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
      },
    })
    return guides.length > 0 ? guides : FALLBACK_GUIDES
  } catch {
    return FALLBACK_GUIDES
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
  const guides = await getGuides()
  const bundle = await getBundle()

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
            Ghiduri create pentru a te ajuta sa preiei controlul asupra vietii tale, pas cu pas.
          </p>
        </div>
      </section>

      {/* Guide Cards Grid */}
      <Section variant="default">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#51087e] mb-3">
            Explorează ghidurile mele
          </h2>
          <p className="text-[#51087e]/60 text-lg max-w-xl mx-auto">
            Acces instant, pași clari, rezultate reale.
          </p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${(guides.length + (bundle ? 1 : 0)) > 4 ? 'lg:grid-cols-3' : 'lg:grid-cols-2 max-w-4xl mx-auto'} gap-8`}>
          {guides.map((guide) => (
            <div
              key={guide.id}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#51087e]/5 hover:border-[#a007dc]/20 hover:-translate-y-1"
            >
              {/* Cover image area */}
              <div className="relative h-52 bg-gradient-to-br from-[#51087e] to-[#51087e]/80 overflow-hidden">
                {guide.coverImage ? (
                  <Image
                     src={imgSrc(guide.coverImage)}
                    alt={guide.title}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl opacity-20">📖</div>
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#51087e] to-transparent" />
                  </div>
                )}
                {/* Price pill */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#a007dc] to-[#e0b0ff] text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md">
                    <span className="text-xs">✦</span>
                    €{guide.price}
                  </span>
                </div>
              </div>
              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#51087e] mb-2 group-hover:text-[#a007dc] transition-colors">
                  {guide.title}
                </h3>
                {guide.description && (
                  <p className="text-[#51087e]/60 text-sm mb-3 line-clamp-2">
                    {guide.description}
                  </p>
                )}
                <p className="text-2xl font-bold text-[#51087e] mb-4">
                  €{guide.price}
                </p>
                <Link
                  href={`/checkout?product=GUIDE&id=${guide.id}`}
                  className="inline-flex items-center justify-center w-full gap-2 border-2 border-[#51087e]/10 text-[#51087e] font-semibold py-3 rounded-xl hover:bg-[#a007dc] hover:text-white hover:border-[#a007dc] transition-all duration-200 text-sm"
                >
                  Cumpără
                  <span className="text-xs">→</span>
                </Link>
              </div>
            </div>
          ))}

          {/* Bundle — same card style as guides */}
          {bundle && (
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#51087e]/5 hover:border-[#a007dc]/20 hover:-translate-y-1">
              {/* Cover area */}
              <div className="relative h-52 bg-gradient-to-br from-[#51087e] to-[#a007dc] overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl opacity-20">📦</div>
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#51087e] to-transparent" />
                </div>
                {/* Price pill */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#a007dc] to-[#e0b0ff] text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md">
                    <span className="text-xs">✦</span>
                    €{bundlePrice}
                  </span>
                </div>
                {/* Savings badge */}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center bg-green-500/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    -{Math.round((bundleSavings / bundleOriginal) * 100)}%
                  </span>
                </div>
              </div>
              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#51087e] mb-2 group-hover:text-[#a007dc] transition-colors">
                  {bundle.title ?? 'Pachet Complet'}
                </h3>
                <p className="text-[#51087e]/60 text-sm mb-3 line-clamp-2">
                  {bundle.items
                    ? bundle.items.map((item) => item.guide.title).join(' + ')
                    : 'Toate ghidurile într-un singur pachet.'}
                </p>
                <div className="flex items-baseline gap-3 mb-4">
                  <p className="text-2xl font-bold text-[#51087e]">
                    €{bundlePrice}
                  </p>
                  <p className="text-base text-[#51087e]/40 line-through">
                    €{bundleOriginal}
                  </p>
                </div>
                <Link
                  href={`/checkout?product=BUNDLE&id=${bundle.id}`}
                  className="inline-flex items-center justify-center w-full gap-2 border-2 border-[#51087e]/10 text-[#51087e] font-semibold py-3 rounded-xl hover:bg-[#a007dc] hover:text-white hover:border-[#a007dc] transition-all duration-200 text-sm"
                >
                  Cumpără Pachetul
                  <span className="text-xs">→</span>
                </Link>
              </div>
            </div>
          )}
      </Section>

      <Footer />
    </>
  )
}
