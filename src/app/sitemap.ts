import type { MetadataRoute } from 'next'
import { generateSitemapEntries } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await generateSitemapEntries()
  return entries
}
