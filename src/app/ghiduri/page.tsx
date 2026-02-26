import Link from 'next/link'
import Image from 'next/image'
import { Navbar, Footer, Section, Badge } from '@/components/ui'
import { prisma } from '@/lib/db'

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
      <div className="relative bg-[#2D1B69] overflow-hidden">
        {/* Decorative mesh gradient */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#E91E8C] rounded-full blur-[128px] -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#FDA4AF] rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <nav className="flex items-center justify-center gap-2 text-sm text-white/50 mb-8">
            <Link href="/" className="hover:text-white/80 transition">Acasă</Link>
            <span>/</span>
            <span className="text-white/90 font-medium">Ghiduri</span>
          </nav>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Ghiduri
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto">
            Ghiduri create pentru a te ajuta să preiei controlul asupra vieții tale, pas cu pas.
          </p>
        </div>
      </div>

      {/* Guide Cards Grid */}
      <Section variant="light-pink" className="py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#2D1B69] mb-3">
            Explorează ghidurile mele
          </h2>
          <p className="text-[#2D1B69]/60 text-lg max-w-xl mx-auto">
            Acces instant, pași clari, rezultate reale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {guides.map((guide) => (
            <div
              key={guide.id}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#2D1B69]/5 hover:border-[#E91E8C]/20 hover:-translate-y-1"
            >
              {/* Cover image area */}
              <div className="relative h-52 bg-gradient-to-br from-[#2D1B69] to-[#2D1B69]/80 overflow-hidden">
                {guide.coverImage ? (
                  <Image
                    src={guide.coverImage}
                    alt={guide.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl opacity-20">📖</div>
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#2D1B69] to-transparent" />
                  </div>
                )}
                {/* Price pill */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#E91E8C] to-[#FDA4AF] text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md">
                    <span className="text-xs">✦</span>
                    €{guide.price}
                  </span>
                </div>
              </div>
              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#2D1B69] mb-2 group-hover:text-[#E91E8C] transition-colors">
                  {guide.title}
                </h3>
                {guide.description && (
                  <p className="text-[#2D1B69]/60 text-sm mb-5 line-clamp-2">
                    {guide.description}
                  </p>
                )}
                <Link
                  href={`/checkout?product=GUIDE&id=${guide.id}`}
                  className="inline-flex items-center justify-center w-full gap-2 border-2 border-[#2D1B69]/10 text-[#2D1B69] font-semibold py-3 rounded-xl hover:bg-[#E91E8C] hover:text-white hover:border-[#E91E8C] transition-all duration-200 text-sm"
                >
                  Cumpără
                  <span className="text-xs">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bundle Card — Featured */}
        <div className="max-w-2xl mx-auto">
          <div className="relative bg-gradient-to-br from-[#2D1B69] to-[#2D1B69]/90 rounded-3xl shadow-2xl overflow-hidden border border-[#E91E8C]/20">
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#E91E8C] rounded-full blur-[80px] opacity-20" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#FDA4AF] rounded-full blur-[60px] opacity-15" />

            <div className="relative p-8 md:p-10">
              {/* Savings badge */}
              <div className="flex items-center gap-3 mb-6">
                <Badge variant="pink" className="text-sm px-4 py-1.5 bg-[#E91E8C]/20 text-[#FDA4AF] font-bold">
                  Economisești €{bundleSavings.toFixed(0)}
                </Badge>
                <Badge variant="green" className="text-sm px-3 py-1.5 bg-green-500/20 text-green-300 font-semibold">
                  {Math.round((bundleSavings / bundleOriginal) * 100)}% reducere
                </Badge>
              </div>

              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {bundle?.title ?? 'Pachet Complet'}
              </h3>
              <p className="text-white/60 mb-6 text-sm md:text-base">
                {bundle?.items
                  ? bundle.items.map((item) => item.guide.title).join(' + ')
                  : 'Toate ghidurile într-un singur pachet — acces instant la întregul set de resurse.'}
              </p>

              {/* Pricing */}
              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-4xl font-bold text-white">
                  €{bundlePrice.toFixed(2)}
                </span>
                <span className="text-lg text-white/40 line-through decoration-[#E91E8C] decoration-2">
                  €{bundleOriginal}
                </span>
              </div>

              {/* CTA */}
              <Link
                href={`/checkout?product=BUNDLE&id=${bundle?.id ?? 'default-bundle'}`}
                className="inline-flex items-center justify-center w-full gap-2 bg-gradient-to-r from-[#E91E8C] to-[#FDA4AF] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity text-lg shadow-lg shadow-[#E91E8C]/25"
              >
                Cumpără Pachetul
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Footer />
    </>
  )
}
