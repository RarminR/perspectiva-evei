import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/profilul-meu/', '/curs/', '/ghidurile-mele/'],
    },
    sitemap: 'https://perspectivaevei.com/sitemap.xml',
  }
}
