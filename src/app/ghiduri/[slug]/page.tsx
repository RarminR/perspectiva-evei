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
    shortDescription: null,
    coverImage: null,
    contentJson: null,
    audioKey: null,
    audioDuration: null,
    pdfKey: null,
  },
]

interface GuideDetail {
  id: string
  title: string
  slug: string
  price: number
  description: string | null
  shortDescription: string | null
  coverImage: string | null
  contentJson: unknown
  audioKey: string | null
  audioDuration: number | null
  pdfKey: string | null
}

async function getGuide(slug: string): Promise<GuideDetail | null> {
  try {
    const guide = await prisma.guide.findUnique({ where: { slug } })
    if (guide) return guide as GuideDetail
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
      id: g.id, title: g.title, slug: g.slug, price: g.price, coverImage: g.coverImage,
    }))
  } catch {
    return FALLBACK_GUIDES.filter((g) => g.slug !== currentSlug).map((g) => ({
      id: g.id, title: g.title, slug: g.slug, price: g.price, coverImage: g.coverImage,
    }))
  }
}

interface GuideContent {
  subtitle: string | null
  aboutText: string | null
  quote: string | null
  highlights: string[]
  features: { title: string; description?: string }[]
  toc: string[]
  badges: string[]
}

function extractContent(contentJson: unknown): GuideContent {
  const empty: GuideContent = { subtitle: null, aboutText: null, quote: null, highlights: [], features: [], toc: [], badges: [] }
  if (!contentJson || typeof contentJson !== 'object') return empty
  const data = contentJson as Record<string, unknown>

  let toc: string[] = []
  if (Array.isArray(data.chapters)) {
    toc = (data.chapters as { title?: string }[]).filter((ch) => ch.title).map((ch) => ch.title as string)
  } else if (Array.isArray(data.pages)) {
    toc = (data.pages as { title?: string }[]).filter((p) => p.title).map((p) => p.title as string)
  }

  const features = Array.isArray(data.features)
    ? (data.features as { title: string; description?: string }[]).filter((f) => f.title)
    : []

  const highlights = Array.isArray(data.highlights)
    ? (data.highlights as string[]).filter((h) => typeof h === 'string')
    : []

  const badges = Array.isArray(data.badges)
    ? (data.badges as string[]).filter((b) => typeof b === 'string')
    : []

  return {
    subtitle: typeof data.subtitle === 'string' ? data.subtitle : null,
    aboutText: typeof data.aboutText === 'string' ? data.aboutText : null,
    quote: typeof data.quote === 'string' ? data.quote : null,
    highlights,
    features,
    toc,
    badges,
  }
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
  const content = extractContent(guide.contentJson)

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className="relative bg-[#51087e] overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#a007dc] rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#e0b0ff] rounded-full blur-[90px] translate-y-1/4 -translate-x-1/3" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
            <Link href="/" className="hover:text-white/80 transition">Acasă</Link>
            <span>/</span>
            <Link href="/ghiduri" className="hover:text-white/80 transition">Ghiduri</Link>
            <span>/</span>
            <span className="text-white/90 font-medium">{guide.title}</span>
          </nav>

          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight text-center">
            {guide.title}
          </h1>
          {(content.subtitle || guide.shortDescription) && (
            <p className="text-white/60 text-lg mt-3 text-center">{content.subtitle || guide.shortDescription}</p>
          )}
        </div>
      </div>

      {/* Despre ghid — Image + Content side by side */}
      <Section variant="default">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start max-w-5xl mx-auto">
          {/* Cover image */}
          <div className="flex justify-center lg:sticky lg:top-8">
            {guide.coverImage ? (
              <Image
                src={imgSrc(guide.coverImage)}
                alt={guide.title}
                width={280}
                height={400}
                unoptimized
                className="rounded-2xl shadow-xl object-cover"
              />
            ) : (
              <div className="w-[280px] aspect-[3/4] bg-gradient-to-br from-[#51087e] to-[#a007dc]/30 rounded-2xl shadow-xl flex items-center justify-center">
                <div className="text-7xl opacity-30">📖</div>
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <h2 className="text-2xl font-bold text-[#51087e] mb-2">Despre ghid:</h2>

            {/* Price pill + badges */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#a007dc] to-[#e0b0ff] text-white text-sm font-bold px-5 py-2 rounded-full">
                <span className="text-xs">✦</span>
                <span>Preț:</span>
                <span className="text-lg">€{guide.price}</span>
              </div>
              {content.badges.map((badge, i) => (
                <div key={i} className="inline-flex items-center gap-2 border-2 border-[#a007dc]/30 text-[#51087e] text-sm font-semibold px-5 py-2 rounded-full">
                  <span className="text-xs">✦</span>
                  <span>{badge}</span>
                </div>
              ))}
            </div>

            {/* About text (rich) or fallback to description */}
            {(content.aboutText || guide.description) && (
              <p className="text-[#2c0246] leading-relaxed text-base mb-6 whitespace-pre-line">
                {content.aboutText || guide.description}
              </p>
            )}

            {/* Quote / highlight block */}
            {content.quote && (
              <div className="bg-gradient-to-r from-[#51087e]/10 to-[#a007dc]/5 border-l-4 border-[#a007dc] rounded-r-xl px-5 py-4 mb-6">
                <p className="text-[#51087e] font-semibold">{content.quote}</p>
              </div>
            )}

            {/* Highlight blocks */}
            {content.highlights.map((hl, i) => (
              <div key={i} className="bg-gradient-to-r from-[#51087e]/10 to-[#a007dc]/5 border-l-4 border-[#a007dc] rounded-r-xl px-5 py-4 mb-6">
                <p className="text-[#51087e] font-semibold">{hl}</p>
              </div>
            ))}

            {/* Feature cards */}
            {content.features.length > 0 && (
              <div className="space-y-4 mb-6">
                {content.features.map((feature, i) => (
                  <div
                    key={i}
                    className="bg-[#f5f0ff] rounded-xl p-5 border border-[#a007dc]/10"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-white shadow-md flex items-center justify-center text-[#51087e]">
                        <span>✦</span>
                      </div>
                      <h3 className="font-bold text-[#51087e]">{feature.title}</h3>
                    </div>
                    {feature.description && (
                      <p className="text-[#2c0246]/70 text-sm leading-relaxed ml-[52px]">{feature.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* What's included */}
            <div className="bg-[#f5f0ff] rounded-xl p-5 border border-[#a007dc]/10 mb-6">
              <h3 className="font-bold text-[#51087e] mb-3">Ce primești:</h3>
              <div className="space-y-2">
                {guide.pdfKey && (
                  <div className="flex items-center gap-2 text-[#2c0246] text-sm">
                    <span className="text-[#a007dc]">✓</span>
                    <span>Ghid PDF — acces instant după achiziție</span>
                  </div>
                )}
                {guide.audioKey && (
                  <div className="flex items-center gap-2 text-[#2c0246] text-sm">
                    <span className="text-[#a007dc]">✓</span>
                    <span>Versiune audiobook{guide.audioDuration ? ` (${Math.round(guide.audioDuration / 60)} min)` : ''}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[#2c0246] text-sm">
                  <span className="text-[#a007dc]">✓</span>
                  <span>Acces permanent din contul tău</span>
                </div>
              </div>
            </div>

            {/* Digital product warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-amber-600 flex-shrink-0">
                  <span>!</span>
                </div>
                <div>
                  <h3 className="font-bold text-amber-800 mb-1">Atenție!</h3>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    <strong>Acesta este un produs digital.</strong><br />
                    Odată ce plata s-a procesat și produsul a fost cumpărat, contravaloarea acestuia este nerambursabilă!
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link
              href={`/checkout?product=GUIDE&id=${guide.id}`}
              className="inline-flex items-center justify-center w-full gap-2 bg-gradient-to-r from-[#a007dc] to-[#e0b0ff] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity text-lg shadow-lg shadow-[#a007dc]/25"
            >
              Cumpără — €{guide.price}
              <span>→</span>
            </Link>
          </div>
        </div>
      </Section>

      {/* Table of Contents */}
      {content.toc.length > 0 && (
        <Section variant="white" className="py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-[#51087e] mb-6">Ce vei descoperi</h2>
            <div className="space-y-3">
              {content.toc.map((item, index) => (
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
              <div
                key={related.id}
                className="group bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-[#51087e]/5 hover:border-[#a007dc]/20"
              >
                <div className="relative h-40 bg-gradient-to-br from-[#51087e] to-[#51087e]/80">
                  {related.coverImage ? (
                    <Image
                       src={imgSrc(related.coverImage)}
                      alt={related.title}
                      fill
                      className="object-cover"
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
                  <h3 className="font-bold text-[#51087e] mb-1">{related.title}</h3>
                  <p className="text-xl font-bold text-[#51087e] mb-4">€{related.price}</p>
                  <div className="flex gap-3">
                    <Link
                      href={`/ghiduri/${related.slug}`}
                      className="inline-flex items-center justify-center flex-1 border-2 border-[#51087e]/10 text-[#51087e] font-semibold py-2.5 rounded-xl hover:bg-[#51087e]/5 transition-all duration-200 text-sm"
                    >
                      Despre
                    </Link>
                    <Link
                      href={`/checkout?product=GUIDE&id=${related.id}`}
                      className="inline-flex items-center justify-center flex-1 gap-1 bg-[#a007dc] text-white font-semibold py-2.5 rounded-xl hover:bg-[#51087e] transition-all duration-200 text-sm"
                    >
                      Cumpără <span className="text-xs">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Bundle card */}
            {bundle && (
              <div className="group bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-[#51087e]/5 hover:border-[#a007dc]/20">
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
                  <h3 className="font-bold text-[#51087e] mb-1">{bundle.title}</h3>
                  <p className="text-[#51087e]/50 text-xs mb-1">{bundle.guideNames.join(' + ')}</p>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-xl font-bold text-[#51087e]">€{bundle.price}</span>
                    <span className="text-sm text-[#51087e]/40 line-through">€{bundle.originalPrice}</span>
                  </div>
                  <Link
                    href={`/checkout?product=BUNDLE&id=${bundle.id}`}
                    className="inline-flex items-center justify-center w-full gap-1 bg-[#a007dc] text-white font-semibold py-2.5 rounded-xl hover:bg-[#51087e] transition-all duration-200 text-sm"
                  >
                    Cumpără pachetul <span className="text-xs">→</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      <Footer />
    </>
  )
}
