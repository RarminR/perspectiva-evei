import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar, Footer, Section } from '@/components/ui'
import { prisma } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Studii de Caz | Perspectiva Evei',
  description:
    'Povești reale de transformare prin manifestare conștientă. Studii de caz de la clienții Evei Popescu.',
  openGraph: {
    title: 'Studii de Caz | Perspectiva Evei',
    description:
      'Transformări reale prin manifestare conștientă. Studii de caz de la clienții Evei Popescu.',
    url: 'https://perspectivaevei.com/studii-de-caz',
    siteName: 'Perspectiva Evei',
    locale: 'ro_RO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Studii de Caz | Perspectiva Evei',
    description:
      'Transformări reale prin manifestare conștientă. Studii de caz de la clienții Evei Popescu.',
  },
}

export const dynamic = 'force-dynamic'

export default async function CaseStudiesPage() {
  const caseStudies = await prisma.caseStudy.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className="bg-[#51087e] text-white">
        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <p className="text-[#e0b0ff] font-medium tracking-widest uppercase text-sm mb-4">Povești Reale</p>
          <h1 className="text-4xl md:text-5xl font-bold">Studii de Caz</h1>
          <p className="text-white/60 text-lg mt-4 max-w-xl mx-auto">
            Transformări reale din viețile celor care au aplicat Legea Asumpției.
          </p>
        </div>
      </div>

      {/* Case Studies */}
      <Section variant="light-pink">
        {caseStudies.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-6">📖</div>
            <p className="text-gray-500 text-lg">Studiile de caz vor fi disponibile în curând.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {caseStudies.map((cs) => (
              <article
                key={cs.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#a007dc]/10 hover:shadow-md hover:border-[#a007dc]/20 transition-all group"
              >
                {cs.coverImage && (
                  <div className="aspect-video overflow-hidden">
                    <Image
                      src={cs.coverImage}
                      alt={cs.title}
                      width={600}
                      height={340}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-8">
                  {cs.clientName && (
                    <span className="inline-block bg-[#a007dc]/10 text-[#a007dc] text-xs font-semibold px-3 py-1 rounded-full mb-4">
                      {cs.clientName}
                    </span>
                  )}
                  <h2 className="text-xl font-bold text-[#51087e] mb-3 group-hover:text-[#a007dc] transition-colors">
                    {cs.title}
                  </h2>
                  {cs.testimonialQuote && (
                    <p className="text-gray-600 italic text-sm leading-relaxed mb-4 line-clamp-3">
                      &ldquo;{cs.testimonialQuote}&rdquo;
                    </p>
                  )}
                  <Link
                    href={`/studii-de-caz/${cs.slug}`}
                    className="inline-flex items-center gap-1 text-[#a007dc] font-semibold text-sm hover:gap-2 transition-all"
                  >
                    Citește povestea <span>→</span>
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
