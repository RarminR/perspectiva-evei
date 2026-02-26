import { prisma } from '@/lib/db'

const BASE_URL = 'https://perspectivaevei.com'

export interface SitemapEntry {
  url: string
  lastModified: Date
  changeFrequency:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never'
  priority: number
}

const STATIC_PAGES: SitemapEntry[] = [
  {
    url: `${BASE_URL}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/cursul-ado`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/ghiduri`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/sedinte-1-la-1`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/despre-mine`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/blog`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/studii-de-caz`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/contact`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.5,
  },
]

export async function generateSitemapEntries(): Promise<SitemapEntry[]> {
  const [blogPosts, caseStudies, guides] = await Promise.all([
    prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.caseStudy.findMany({
      select: { slug: true, updatedAt: true },
    }),
    prisma.guide.findMany({
      select: { slug: true, updatedAt: true },
    }),
  ])

  const dynamicEntries: SitemapEntry[] = [
    ...blogPosts.map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...caseStudies.map((c) => ({
      url: `${BASE_URL}/studii-de-caz/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...guides.map((g) => ({
      url: `${BASE_URL}/ghiduri/${g.slug}`,
      lastModified: g.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]

  return [...STATIC_PAGES, ...dynamicEntries]
}
