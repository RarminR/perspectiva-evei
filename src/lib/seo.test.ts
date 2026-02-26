import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    blogPost: {
      findMany: vi.fn().mockResolvedValue([
        { slug: 'test-post', updatedAt: new Date('2026-01-01') },
      ]),
    },
    caseStudy: {
      findMany: vi.fn().mockResolvedValue([
        { slug: 'test-case', updatedAt: new Date('2026-01-01') },
      ]),
    },
    guide: {
      findMany: vi.fn().mockResolvedValue([
        { slug: 'test-guide', updatedAt: new Date('2026-01-01') },
      ]),
    },
  },
}))

import { generateSitemapEntries } from './seo'

describe('SEO', () => {
  it('includes all static public pages in sitemap', async () => {
    const entries = await generateSitemapEntries()
    const urls = entries.map((e) => e.url)

    expect(urls).toContain('https://perspectivaevei.com/')
    expect(urls).toContain('https://perspectivaevei.com/cursul-ado')
    expect(urls).toContain('https://perspectivaevei.com/ghiduri')
    expect(urls).toContain('https://perspectivaevei.com/sedinte-1-la-1')
    expect(urls).toContain('https://perspectivaevei.com/despre-mine')
    expect(urls).toContain('https://perspectivaevei.com/blog')
    expect(urls).toContain('https://perspectivaevei.com/studii-de-caz')
    expect(urls).toContain('https://perspectivaevei.com/contact')
  })

  it('includes published blog posts in sitemap', async () => {
    const entries = await generateSitemapEntries()
    const urls = entries.map((e) => e.url)

    expect(urls).toContain('https://perspectivaevei.com/blog/test-post')
  })

  it('includes published case studies in sitemap', async () => {
    const entries = await generateSitemapEntries()
    const urls = entries.map((e) => e.url)

    expect(urls).toContain('https://perspectivaevei.com/studii-de-caz/test-case')
  })

  it('includes guides in sitemap', async () => {
    const entries = await generateSitemapEntries()
    const urls = entries.map((e) => e.url)

    expect(urls).toContain('https://perspectivaevei.com/ghiduri/test-guide')
  })

  it('sitemap entries have correct priority for homepage', async () => {
    const entries = await generateSitemapEntries()
    const homepage = entries.find((e) => e.url === 'https://perspectivaevei.com/')

    expect(homepage).toBeDefined()
    expect(homepage!.priority).toBe(1.0)
  })

  it('sitemap entries have lastModified dates', async () => {
    const entries = await generateSitemapEntries()

    entries.forEach((entry) => {
      expect(entry.lastModified).toBeInstanceOf(Date)
    })
  })

  it('dynamic entries use updatedAt from database', async () => {
    const entries = await generateSitemapEntries()
    const blogEntry = entries.find((e) => e.url === 'https://perspectivaevei.com/blog/test-post')

    expect(blogEntry).toBeDefined()
    expect(blogEntry!.lastModified).toEqual(new Date('2026-01-01'))
  })

  it('sitemap entries have valid changeFrequency values', async () => {
    const entries = await generateSitemapEntries()
    const validFrequencies = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']

    entries.forEach((entry) => {
      expect(validFrequencies).toContain(entry.changeFrequency)
    })
  })
})
