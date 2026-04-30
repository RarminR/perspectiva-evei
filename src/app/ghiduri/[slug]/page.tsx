import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Navbar, Footer, Section } from '@/components/ui'
import { auth } from '@/lib/auth'
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
    type: 'PDF' as const,
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
  coverImage: string | null
  contentJson: unknown
  type: 'PDF' | 'AUDIO'
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
  type: 'PDF' | 'AUDIO'
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
      select: { id: true, title: true, slug: true, price: true, coverImage: true, type: true },
    })
    if (guides.length > 0) return guides
    return FALLBACK_GUIDES.filter((g) => g.slug !== currentSlug).map((g) => ({
      id: g.id, title: g.title, slug: g.slug, price: g.price, coverImage: g.coverImage, type: g.type,
    }))
  } catch {
    return FALLBACK_GUIDES.filter((g) => g.slug !== currentSlug).map((g) => ({
      id: g.id, title: g.title, slug: g.slug, price: g.price, coverImage: g.coverImage, type: g.type,
    }))
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

  const session = await auth()
  const userId = (session?.user as any)?.id ?? null

  const [relatedGuides, bundle, ownedGuideIds] = await Promise.all([
    getRelatedGuides(slug),
    getActiveBundle(),
    getOwnedGuideIds(userId),
  ])
  const content = extractContent(guide.contentJson)
  const isOwned = ownedGuideIds.has(guide.id)
  const ownedCtaLabel = guide.type === 'AUDIO' ? 'Ascultă' : 'Citește'

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
          {content.subtitle && (
            <p className="text-white/60 text-lg mt-3 text-center">{content.subtitle}</p>
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
              <div className="inline-flex items-center gap-2 bg-[#a007dc] text-white text-sm font-bold px-5 py-2 rounded-full">
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
                {guide.type === 'AUDIO' ? (
                  <div className="flex items-center gap-2 text-[#2c0246] text-sm">
                    <span className="text-[#a007dc]">✓</span>
                    <span>Audiobook{guide.audioDuration ? ` (${Math.round(guide.audioDuration / 60)} min)` : ''} — acces instant după achiziție</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[#2c0246] text-sm">
                    <span className="text-[#a007dc]">✓</span>
                    <span>Ghid PDF — acces instant după achiziție</span>
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
            {isOwned ? (
              <Link
                href={`/ghidurile-mele/${guide.slug}`}
                className="inline-flex items-center justify-center w-full gap-2 bg-[#a007dc] text-white font-bold py-4 rounded-xl hover:bg-[#51087e] transition-colors text-lg"
              >
                {ownedCtaLabel} acum
                <span>→</span>
              </Link>
            ) : (
              <Link
                href={`/checkout?product=GUIDE&id=${guide.id}`}
                className="inline-flex items-center justify-center w-full gap-2 bg-[#a007dc] text-white font-bold py-4 rounded-xl hover:bg-[#51087e] transition-colors text-lg"
              >
                Cumpără — €{guide.price}
                <span>→</span>
              </Link>
            )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {relatedGuides.map((related) => {
              const relatedOwned = ownedGuideIds.has(related.id)
              const relatedOwnedLabel = related.type === 'AUDIO' ? 'Ascultă' : 'Citește'
              return (
              <div
                key={related.id}
                className="group relative flex flex-col rounded-[24px] overflow-hidden shadow-[0_20px_40px_rgba(81,8,126,0.15)] hover:shadow-[0_28px_56px_rgba(81,8,126,0.25)] hover:-translate-y-1 transition-all duration-300 text-white"
                style={{
                  backgroundImage: 'linear-gradient(180deg, #e8c2ff 0%, #a62bf1 38%, #51087e 72%, #2c0246 100%)',
                }}
              >
                <div className="relative flex items-center justify-center pt-10 pb-6 px-8">
                  <div className="relative aspect-[3/4] w-[65%] drop-shadow-[0_18px_30px_rgba(44,2,70,0.45)] group-hover:scale-[1.03] transition-transform duration-500">
                    {related.coverImage ? (
                      <Image
                        src={imgSrc(related.coverImage)}
                        alt={related.title}
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
                  <div>
                    <span
                      className="inline-flex items-center gap-2 text-sm font-bold px-4 py-1.5 rounded-full shadow-md text-white"
                      style={{ backgroundImage: 'linear-gradient(90deg, #a007dc, #e0b0ff)' }}
                    >
                      <span className="text-xs">✦</span>€{related.price}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold leading-tight mt-1 text-white">
                    {related.title}
                  </h3>
                  <div className="mt-auto pt-4 flex flex-col sm:flex-row gap-3">
                    {relatedOwned ? (
                      <Link
                        href={`/ghidurile-mele/${related.slug}`}
                        className="inline-flex items-center justify-center w-full gap-2 font-semibold py-3 px-5 rounded-full text-[#51087e] bg-white hover:bg-[#f3e8ff] transition-colors duration-200 no-underline"
                      >
                        {relatedOwnedLabel}
                        <span aria-hidden>→</span>
                      </Link>
                    ) : (
                      <>
                        <Link
                          href={`/ghiduri/${related.slug}`}
                          className="inline-flex items-center justify-center flex-1 gap-2 border font-semibold py-3 px-5 rounded-full text-white hover:bg-white/10 transition-colors duration-200 no-underline"
                          style={{ borderColor: 'rgba(255,255,255,0.5)' }}
                        >
                          Află mai mult
                        </Link>
                        <Link
                          href={`/checkout?product=GUIDE&id=${related.id}`}
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

            {/* Bundle card */}
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
                      alt={bundle.title}
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
                      <span className="text-xs line-through opacity-70">€{bundle.originalPrice}</span>
                      <span>€{bundle.price}</span>
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold leading-tight mt-1 text-white">
                    {bundle.title}
                  </h3>
                  <p className="text-[0.95rem] leading-relaxed text-white/80">
                    {bundle.guideNames.join(' + ')}
                  </p>
                  <div className="mt-auto pt-4">
                    <span
                      className="inline-flex items-center justify-between w-full gap-2 border font-semibold py-3 px-5 rounded-full text-white"
                      style={{ borderColor: 'rgba(255,255,255,0.5)' }}
                    >
                      Cumpără pachetul
                      <span aria-hidden>→</span>
                    </span>
                  </div>
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
