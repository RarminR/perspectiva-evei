import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Navbar, Footer, Section } from '@/components/ui'
import { prisma } from '@/lib/db'
import { imgSrc } from '@/lib/image'

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const caseStudy = await prisma.caseStudy.findUnique({
    where: { slug },
  })

  if (!caseStudy || !caseStudy.published) {
    notFound()
  }

  return (
    <>
      <Navbar />

      <article>
        {/* Header */}
        <div className="bg-[#51087e] text-white">
          <div className="max-w-3xl mx-auto px-4 py-16 text-center">
            <Link
              href="/studii-de-caz"
              className="inline-flex items-center gap-1 text-[#e0b0ff]/70 text-sm hover:text-[#e0b0ff] transition mb-6"
            >
              <span>←</span> Înapoi la Studii de Caz
            </Link>
            {caseStudy.clientName && (
              <span className="block text-[#e0b0ff]/60 text-sm mb-4">{caseStudy.clientName}</span>
            )}
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              {caseStudy.title}
            </h1>
          </div>
        </div>

        {/* Cover Image */}
        {caseStudy.coverImage && (
          <div className="max-w-4xl mx-auto px-4 -mt-8">
            <Image
               src={imgSrc(caseStudy.coverImage)}
              alt={caseStudy.title}
              width={1200}
              height={600}
              className="w-full rounded-2xl shadow-xl object-cover max-h-96"
            />
          </div>
        )}

        {/* Testimonial Quote */}
        {caseStudy.testimonialQuote && (
          <Section variant="light-pink">
            <div className="max-w-3xl mx-auto text-center">
              <div className="text-5xl text-[#a007dc]/30 mb-4">&ldquo;</div>
              <p className="text-xl md:text-2xl text-[#51087e] italic leading-relaxed font-medium">
                {caseStudy.testimonialQuote}
              </p>
              {caseStudy.clientName && (
                <p className="mt-6 text-[#a007dc] font-semibold">— {caseStudy.clientName}</p>
              )}
            </div>
          </Section>
        )}

        {/* Content */}
        <Section variant="white">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-lg prose-gray max-w-none">
              {caseStudy.content?.split('\n').map((paragraph, i) => (
                paragraph.trim() ? <p key={i} className="text-gray-700 leading-relaxed mb-4">{paragraph}</p> : null
              ))}
            </div>

            {/* CTA */}
            <div className="mt-16 pt-8 border-t border-gray-200 text-center">
              <p className="text-gray-600 mb-4">Vrei să experimentezi o transformare similară?</p>
              <Link
                href="/sedinte-1-la-1"
                className="inline-flex items-center gap-2 bg-[#a007dc] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#a007dc]/90 transition-all"
              >
                Descoperă Ședințele 1:1 <span>→</span>
              </Link>
            </div>
          </div>
        </Section>
      </article>

      <Footer />
    </>
  )
}
