import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Navbar, Footer, Section, Badge } from '@/components/ui'
import { prisma } from '@/lib/db'
import { imgSrc } from '@/lib/image'

const FALLBACK_GUIDES = [
  {
    id: '1',
    title: 'Cine Manifestă?!',
    slug: 'cine-manifesta',
    price: 99,
    description: 'Ghidul care îți dezvăluie secretele manifestării conștiente.',
    coverImage: null,
    contentJson: null,
    audioKey: null,
    audioDuration: null,
  },
  {
    id: '2',
    title: 'Ghidul Abundenței',
    slug: 'ghidul-abundentei',
    price: 99,
    description: 'Transformă-ți relația cu banii și abundența.',
    coverImage: null,
    contentJson: null,
    audioKey: null,
    audioDuration: null,
  },
  {
    id: '3',
    title: 'Ghidul Relațiilor',
    slug: 'ghidul-relatiilor',
    price: 99,
    description: 'Manifestă relații sănătoase și iubitoare.',
    coverImage: null,
    contentJson: null,
    audioKey: null,
    audioDuration: null,
  },
]

interface GuideDetail {
  id: string
  title: string
  slug: string
  price: number
  description: string | null
  coverImage: string | null
  contentJson: unknown
  audioKey: string | null
  audioDuration: number | null
}

async function getGuide(slug: string): Promise<GuideDetail | null> {
  try {
    const guide = await prisma.guide.findUnique({ where: { slug } })
    if (guide) return guide as GuideDetail
    // Fallback
    const fallback = FALLBACK_GUIDES.find((g) => g.slug === slug)
    return fallback ?? null
  } catch {
    const fallback = FALLBACK_GUIDES.find((g) => g.slug === slug)
    return fallback ?? null
  }
}

interface RelatedGuide {
  id: string
  title: string
  slug: string
  price: number
  coverImage: string | null
}

interface BundleCard {
  id: string
  title: string
  price: number
  originalPrice: number
  guideNames: string[]
}

async function getActiveBundle(): Promise<BundleCard | null> {
  try {
    const bundle = await prisma.bundle.findFirst({
      where: { active: true },
      include: {
        items: {
          include: { guide: { select: { title: true } } },
        },
      },
    })
    if (!bundle) return null
    return {
      id: bundle.id,
      title: bundle.title,
      price: bundle.price,
      originalPrice: bundle.originalPrice,
      guideNames: bundle.items.map((i) => i.guide.title),
    }
  } catch {
    return null
  }
}

async function getRelatedGuides(currentSlug: string): Promise<RelatedGuide[]> {
  try {
    const guides = await prisma.guide.findMany({
      where: { slug: { not: currentSlug } },
      take: 3,
      select: { id: true, title: true, slug: true, price: true, coverImage: true },
    })
    if (guides.length > 0) return guides
    return FALLBACK_GUIDES.filter((g) => g.slug !== currentSlug).map((g) => ({
      id: g.id,
      title: g.title,
      slug: g.slug,
      price: g.price,
      coverImage: g.coverImage,
    }))
  } catch {
    return FALLBACK_GUIDES.filter((g) => g.slug !== currentSlug).map((g) => ({
      id: g.id,
      title: g.title,
      slug: g.slug,
      price: g.price,
      coverImage: g.coverImage,
    }))
  }
}

function extractToc(contentJson: unknown): string[] {
  if (!contentJson || typeof contentJson !== 'object') return []
  const data = contentJson as Record<string, unknown>
  if (Array.isArray(data.chapters)) {
    return (data.chapters as { title?: string }[])
      .filter((ch) => ch.title)
      .map((ch) => ch.title as string)
  }
  if (Array.isArray(data.pages)) {
    return (data.pages as { title?: string }[])
      .filter((p) => p.title)
      .map((p) => p.title as string)
  }
  return []
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const guide = await getGuide(slug)

  if (!guide) {
    notFound()
  }

  const relatedGuides = await getRelatedGuides(slug)
  const bundle = await getActiveBundle()
  const toc = extractToc(guide.contentJson)

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className="relative bg-[#51087e] overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#a007dc] rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#e0b0ff] rounded-full blur-[90px] translate-y-1/4 -translate-x-1/3" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
            <Link href="/" className="hover:text-white/80 transition">Acasă</Link>
            <span>/</span>
            <Link href="/ghiduri" className="hover:text-white/80 transition">Ghiduri</Link>
            <span>/</span>
            <span className="text-white/90 font-medium">{guide.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text content */}
            <div>
              <Badge variant="pink" className="mb-4 bg-[#a007dc]/20 text-[#e0b0ff]">
                Ghid Digital
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 tracking-tight leading-tight">
                {guide.title}
              </h1>
              {guide.description && (
                <p className="text-white/70 text-lg mb-8 leading-relaxed">
                  {guide.description}
                </p>
              )}
              <div className="flex items-center gap-6">
                <span className="text-3xl font-bold text-white">€{guide.price}</span>
                <Link
                  href={`/checkout?product=GUIDE&id=${guide.id}`}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#a007dc] to-[#e0b0ff] text-white font-bold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[#a007dc]/25 text-lg"
                >
                  Cumpără acum
                  <span>→</span>
                </Link>
              </div>
              {guide.audioKey && (
                <div className="mt-5 flex items-center gap-2 text-white/50 text-sm">
                  <span>🎧</span>
                  <span>Include versiunea audio{guide.audioDuration ? ` (${Math.round(guide.audioDuration / 60)} min)` : ''}</span>
                </div>
              )}
            </div>

            {/* Cover image */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                {guide.coverImage ? (
                  <Image
                     src={imgSrc(guide.coverImage)}
                    alt={guide.title}
                    width={440}
                    height={580}
                    className="rounded-2xl shadow-2xl object-cover"
                  />
                ) : (
                  <div className="aspect-[3/4] bg-gradient-to-br from-[#51087e] to-[#a007dc]/30 rounded-2xl shadow-2xl flex items-center justify-center border border-white/10">
                    <div className="text-8xl opacity-30">📖</div>
                  </div>
                )}
                {/* Decorative floating element */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#a007dc]/20 rounded-xl blur-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      {toc.length > 0 && (
        <Section variant="white" className="py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-[#51087e] mb-6">Ce vei descoperi</h2>
            <div className="space-y-3">
              {toc.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl bg-[#f5f0ff] border border-[#a007dc]/10"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#a007dc] text-white text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-[#51087e] font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Related Guides + Bundle */}
      {(relatedGuides.length > 0 || bundle) && (
        <Section variant="light-pink" className="py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[#51087e] mb-2">
              Alte ghiduri care te-ar putea interesa
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedGuides.map((related) => (
              <Link
                key={related.id}
                href={`/ghiduri/${related.slug}`}
                className="group bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-[#51087e]/5 hover:border-[#a007dc]/20 hover:-translate-y-1"
              >
                <div className="relative h-40 bg-gradient-to-br from-[#51087e] to-[#51087e]/80">
                  {related.coverImage ? (
                    <Image
                       src={imgSrc(related.coverImage)}
                      alt={related.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-5xl opacity-20">📖</div>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 bg-[#a007dc] text-white text-xs font-bold px-3 py-1 rounded-full">
                      €{related.price}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-[#51087e] group-hover:text-[#a007dc] transition-colors">
                    {related.title}
                  </h3>
                  <span className="text-sm text-[#a007dc] mt-2 inline-flex items-center gap-1 font-medium">
                    Descoperă <span>→</span>
                  </span>
                </div>
              </Link>
            ))}

            {/* Bundle card */}
            {bundle && (
              <Link
                href={`/checkout?product=BUNDLE&id=${bundle.id}`}
                className="group bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-[#51087e]/5 hover:border-[#a007dc]/20 hover:-translate-y-1"
              >
                <div className="relative h-40 bg-gradient-to-br from-[#51087e] to-[#a007dc]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-5xl opacity-20">📦</div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 bg-[#a007dc] text-white text-xs font-bold px-3 py-1 rounded-full">
                      €{bundle.price}
                    </span>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center bg-green-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">
                      -{Math.round(((bundle.originalPrice - bundle.price) / bundle.originalPrice) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-[#51087e] group-hover:text-[#a007dc] transition-colors">
                    {bundle.title}
                  </h3>
                  <p className="text-[#51087e]/50 text-xs mt-1">{bundle.guideNames.join(' + ')}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-sm text-[#a007dc] font-bold">€{bundle.price}</span>
                    <span className="text-xs text-[#51087e]/40 line-through">€{bundle.originalPrice}</span>
                  </div>
                  <span className="text-sm text-[#a007dc] mt-2 inline-flex items-center gap-1 font-medium">
                    Cumpără pachetul <span>→</span>
                  </span>
                </div>
              </Link>
            )}
          </div>
        </Section>
      )}

      <Footer />
    </>
  )
}
