import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar, Footer, Section } from '@/components/ui'
import { prisma } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Blog | Perspectiva Evei',
  description:
    'Articole și resurse despre manifestare conștientă, creștere personală și transformare autentică de la Eva Popescu.',
  openGraph: {
    title: 'Blog | Perspectiva Evei',
    description:
      'Articole despre manifestare conștientă și creștere personală de la Eva Popescu.',
    url: 'https://perspectivaevei.com/blog',
    siteName: 'Perspectiva Evei',
    locale: 'ro_RO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Perspectiva Evei',
    description:
      'Articole despre manifestare conștientă și creștere personală de la Eva Popescu.',
  },
}

export const dynamic = 'force-dynamic'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    take: 10,
  })

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className="bg-[#2D1B69] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(233,30,140,0.12),_transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <p className="text-[#FDA4AF] font-medium tracking-widest uppercase text-sm mb-4">Articole și Resurse</p>
          <h1 className="text-4xl md:text-5xl font-bold">Blog</h1>
          <p className="text-white/60 text-lg mt-4 max-w-xl mx-auto">
            Gânduri, lecții și perspective din lumea manifestării conștiente.
          </p>
        </div>
      </div>

      {/* Posts */}
      <Section variant="white">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-6">📝</div>
            <p className="text-gray-500 text-lg">Articolele vor fi disponibile în curând.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-[#E91E8C]/20 transition-all group"
              >
                {post.coverImage && (
                  <div className="aspect-video overflow-hidden">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      width={600}
                      height={340}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-6">
                  {post.publishedAt && (
                    <time className="text-sm text-[#E91E8C]/70 font-medium">
                      {formatDate(new Date(post.publishedAt))}
                    </time>
                  )}
                  <h2 className="text-xl font-bold text-[#2D1B69] mt-2 mb-3 group-hover:text-[#E91E8C] transition-colors">
                    {post.title}
                  </h2>
                  {post.content && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
                      {post.content.substring(0, 160)}...
                    </p>
                  )}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-[#E91E8C] font-semibold text-sm hover:gap-2 transition-all"
                  >
                    Citește mai mult <span>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Footer />
    </>
  )
}
