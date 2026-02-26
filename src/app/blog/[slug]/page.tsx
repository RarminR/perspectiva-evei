import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Navbar, Footer, Section } from '@/components/ui'
import { prisma } from '@/lib/db'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  })

  if (!post || !post.published) {
    notFound()
  }

  return (
    <>
      <Navbar />

      <article>
        {/* Header */}
        <div className="bg-[#2D1B69] text-white">
          <div className="max-w-3xl mx-auto px-4 py-16 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-[#FDA4AF]/70 text-sm hover:text-[#FDA4AF] transition mb-6"
            >
              <span>←</span> Înapoi la Blog
            </Link>
            {post.publishedAt && (
              <time className="block text-[#FDA4AF]/60 text-sm mb-4">
                {formatDate(new Date(post.publishedAt))}
              </time>
            )}
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              {post.title}
            </h1>
          </div>
        </div>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="max-w-4xl mx-auto px-4 -mt-8">
            <Image
              src={post.coverImage}
              alt={post.title}
              width={1200}
              height={600}
              className="w-full rounded-2xl shadow-xl object-cover max-h-96"
            />
          </div>
        )}

        {/* Content */}
        <Section variant="white">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-lg prose-gray max-w-none">
              {post.content?.split('\n').map((paragraph, i) => (
                paragraph.trim() ? <p key={i} className="text-gray-700 leading-relaxed mb-4">{paragraph}</p> : null
              ))}
            </div>

            {/* Share */}
            <div className="mt-16 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3">Distribuie acest articol</p>
              <div className="flex gap-3">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`/blog/${post.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#2D1B69]/5 flex items-center justify-center text-[#2D1B69] hover:bg-[#E91E8C] hover:text-white transition"
                >
                  f
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#2D1B69]/5 flex items-center justify-center text-[#2D1B69] hover:bg-[#E91E8C] hover:text-white transition"
                >
                  𝕏
                </a>
              </div>
            </div>
          </div>
        </Section>
      </article>

      <Footer />
    </>
  )
}
