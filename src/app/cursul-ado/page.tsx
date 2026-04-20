import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar, Footer, Section, Badge, Accordion } from '@/components/ui'
import { getCourseWithEditions } from '@/services/course'
import { COURSE_PRICING, PRICING_FEATURES } from '@/lib/constants/pricing'
import { formatEditionRange } from '@/lib/edition'

export const metadata: Metadata = {
  title: 'Cursul A.D.O. | Perspectiva Evei',
  description:
    'Cursul A.D.O. (Alege! Decide! Observă!) — 8 săptămâni de transformare autentică cu Eva Popescu. Max. 15 participanți, sesiuni live pe Zoom.',
  openGraph: {
    title: 'Cursul A.D.O. | Perspectiva Evei',
    description:
      '8 săptămâni de manifestare conștientă cu Eva Popescu. Max. 15 participanți.',
    url: 'https://perspectivaevei.com/cursul-ado',
    siteName: 'Perspectiva Evei',
    locale: 'ro_RO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cursul A.D.O. | Perspectiva Evei',
    description:
      '8 săptămâni de manifestare conștientă cu Eva Popescu. Max. 15 participanți.',
  },
}

export const dynamic = 'force-dynamic'


// ─── Pricing Constants (from shared) ─────────────────────────────
const { FULL_PRICE, FULL_PRICE_CROSSED, INSTALLMENT_PRICE, INSTALLMENT_TOTAL, SAVINGS_PERCENT } = COURSE_PRICING

// ─── FAQ Content (from Webflow reference) ──────────────────────
const FAQ_ITEMS = [
  {
    question: 'Cu ce se diferențiază Cursul A.D.O.! de alte cursuri de manifestare conștientă?',
    answer:
      'Cursul A.D.O.! nu se bazează pe tehnici rapide sau afirmații, ci te învață să îți disciplinezi mintea și să privești întreaga ta realitate dintr-un alt punct de vedere — Observatorul. Acesta este un proces de transformare autentică, care îți oferă claritate și te ghidează să creezi conștient o viață care reflectă adevărata ta identitate.',
  },
  {
    question: 'Care este structura cursului?',
    answer:
      'Cursul durează 8 săptămâni, cu câte o sesiune săptămânală de 2 ore, desfășurată live pe platforma Zoom. Participanții au ocazia să discute deschis despre propriile situații și să primească îndrumare personalizată, într-un grup restrâns de maxim 15 de persoane.',
  },
  {
    question: 'Cum mă va ajuta acest curs să îmi transform viața?',
    answer:
      'Prin înțelegerea și aplicarea conceptelor manifestării conștiente, vei dobândi claritate asupra identității tale interioare și vei învăța cum să privești ceea ce se întâmplă în realitatea ta, astfel încât să transformi complet ceea ce trăiești acum.',
  },
  {
    question: 'Ce se întâmplă dacă nu pot participa la o sesiune?',
    answer:
      'Dacă nu poți ajunge la o sesiune, aceasta va fi înregistrată, iar tu vei primi acces la înregistrare în 24 de ore, pentru a te asigura că nu pierzi niciun pas din procesul tău.',
  },
  {
    question: 'De ce cursuri de grup și nu ședințe individuale?',
    answer:
      'Participarea într-un grup restrâns îți oferă șansa de a învăța nu doar din propriile experiențe, ci și din ale celorlalți. Întrebările și observațiile colegilor te vor ajuta să câștigi noi perspective și să îți accelerezi procesul de transformare.',
  },
]

// ─── 8-Week Curriculum ─────────────────────────────────────────
const CURRICULUM = [
  { week: 1, title: 'Fundamentele Manifestării', description: 'Înțelege cum funcționează legea atracției și conștiința.' },
  { week: 2, title: 'Aliniere — A', description: 'Alinierea cu dorințele tale profunde și cu cine ești cu adevărat.' },
  { week: 3, title: 'Detașare — D', description: 'Arta detașării de rezultat și încrederea în proces.' },
  { week: 4, title: 'Obținere — O', description: 'Primirea cu grație a ceea ce ai manifestat.' },
  { week: 5, title: 'Blocaje și Credințe Limitative', description: 'Identifică și depășește blocajele interioare care te opresc.' },
  { week: 6, title: 'Practici Zilnice', description: 'Rutine și practici pentru manifestare constantă în fiecare zi.' },
  { week: 7, title: 'Integrare', description: 'Integrarea tuturor conceptelor în viața ta de zi cu zi.' },
  { week: 8, title: 'Manifestarea în Acțiune', description: 'Pași concreți pentru a-ți trăi viața pe care o alegi conștient.' },
]

// ─── Testimonials ──────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: 'Eva, te iubesc! Dacă ai ști cât de mult s-a schimbat tot după cursul tău... Voi fi mereu recunoscătoare!',
    name: 'Roxana',
    role: 'Absolventă Cursul A.D.O.',
  },
  {
    quote: 'Singurul curs care te scoate din întuneric este A.D.O.! Totul este atât de simplu, și nu ai nevoie de niciun alt curs după.',
    name: 'Loredana',
    role: 'Absolventă Cursul A.D.O.',
  },
  {
    quote: 'Am învățat că totul pleacă de la mine. Perspectiva mea s-a schimbat complet, iar viața a început să reflecte asta.',
    name: 'Elena',
    role: 'Absolventă Cursul A.D.O.',
  },
]

// ─── Benefits ──────────────────────────────────────────────────
const BENEFITS = [
  { title: 'Înțelegi manifestarea conștientă', description: 'Manifești ceea ce îți dorești fără efort, frustrare sau frică.' },
  { title: 'Te bucuri de atenție personalizată', description: 'Te deschizi într-un spațiu restrâns și sigur, unde ești ghidat personalizat.' },
  { title: 'Deprinzi un nou mod de gândire', description: 'Schimbi perspectiva din „mi se întâmplă" în „îmi asum tot ceea ce trăiesc".' },
  { title: 'Ajungi la cârma propriei vieți', description: 'Deprinzi starea de Observator, din care alegi conștient parcursul vieții tale.' },
]

// ─── Pricing Features (from shared) ─────────────────────────────
// Re-exported from @/lib/constants/pricing as PRICING_FEATURES

export default async function CursulAdoPage() {
  // Fetch course data with enrollment counts
  const course = await getCourseWithEditions('cursul-ado')
  const activeEdition = course?.editions?.find((e) => e.enrollmentOpen)

  return (
    <>
      <Navbar />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-[#51087e] text-white">
        {/* Decorative grain overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')] pointer-events-none" />
        {/* Gradient orb */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#a007dc]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#e0b0ff]/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
              <Link href="/" className="hover:text-white/80 transition">Acasă</Link>
              <span>/</span>
              <span className="text-white/80">Cursul A.D.O.</span>
            </nav>

            {activeEdition && (
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="inline-flex items-center gap-2 bg-white/25 backdrop-blur-sm rounded-full px-5 py-2 text-sm font-medium text-white">
                  <span className="text-[#e0b0ff]">●</span>
                  <span>Locuri restrânse</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-white/25 backdrop-blur-sm rounded-full px-5 py-2 text-sm font-medium text-white">
                  <span>
                    Ediția {activeEdition.editionNumber}:{' '}
                    {formatEditionRange(activeEdition.startDate, activeEdition.endDate)}
                  </span>
                </div>
              </div>
            )}

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              <span className="bg-gradient-to-r from-[#a007dc] via-[#e0b0ff] to-[#a007dc] bg-clip-text text-transparent">
                Cursul A.D.O.
              </span>
              <br />
              <span className="text-white text-3xl md:text-4xl lg:text-5xl font-light">
                Alege. Decide. Observă.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 leading-relaxed mb-8 max-w-2xl">
              Fără tehnici. Fără meditații. Fără teme. Doar tu, într-o postură complet nouă — cea a centrului realității tale!
            </p>

            {/* Enrollment status */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              {!activeEdition && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2.5">
                  <span className="text-sm font-medium">Înscrierea se deschide în curând</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>8 săptămâni · sesiuni live pe Zoom</span>
              </div>
            </div>

            <Link
              href="#preturi"
              className="inline-flex items-center gap-2 bg-[#a007dc] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#a007dc]/90 transition-all hover:shadow-lg hover:shadow-[#a007dc]/25 hover:-translate-y-0.5"
            >
              Vezi prețurile
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ BENEFITS ═══ */}
      <Section variant="light-pink">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#51087e] mb-4">
            În cursul A.D.O.!
          </h2>
          <p className="text-[#51087e]/60 max-w-xl mx-auto">
            Descoperă ce te așteaptă în cele 8 săptămâni de transformare autentică.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {BENEFITS.map((benefit, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-[#a007dc]/10 hover:border-[#a007dc]/30"
            >
              <div className="absolute top-0 left-8 w-12 h-1 bg-gradient-to-r from-[#a007dc] to-[#e0b0ff] rounded-b-full" />
              <h3 className="text-lg font-bold text-[#51087e] mb-2 group-hover:text-[#a007dc] transition-colors">
                {benefit.title}
              </h3>
              <p className="text-[#51087e]/60 text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══ PRICING ═══ */}
      <section id="preturi" className="relative bg-[#51087e] py-20 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#a007dc]/10 rounded-full blur-[200px] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Vreau să mă înscriu la Cursul A.D.O.!
          </h2>
          <p className="text-white/60 mb-4">...pentru că sunt decis să îmi schimb realitatea.</p>

          {activeEdition && (
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <Badge variant="purple" className="bg-white/10 text-white border border-white/20 px-4 py-1.5">
                Ediția {activeEdition.editionNumber}:{' '}
                {formatEditionRange(activeEdition.startDate, activeEdition.endDate)}
              </Badge>
              <Badge variant="purple" className="bg-white/10 text-white border border-white/20 px-4 py-1.5">
                Online · Zoom
              </Badge>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Full Payment Card */}
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/15 rounded-2xl p-8 text-left hover:border-white/30 transition-all">
              <div className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Plată integrală</div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-white">{FULL_PRICE}</span>
                <span className="text-white/40 line-through text-lg">{FULL_PRICE_CROSSED}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 text-xs font-medium px-2.5 py-1 rounded-full mb-6">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Salvezi {SAVINGS_PERCENT}
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2.5 text-sm text-white/70">
                  <svg className="w-4 h-4 text-[#a007dc] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Cost redus comparativ cu plata în rate
                </li>
                {PRICING_FEATURES.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                    <svg className="w-4 h-4 text-[#a007dc] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/checkout?product=COURSE&type=full"
                className="block w-full text-center bg-white/10 border border-white/20 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-white/20 transition-all"
              >
                Cumpără acum
              </Link>
            </div>

            {/* Installment Card — Featured */}
            <div className="relative bg-gradient-to-b from-[#a007dc]/10 to-transparent backdrop-blur-sm border-2 border-[#a007dc]/50 rounded-2xl p-8 text-left ring-4 ring-[#a007dc]/10">
              <div className="absolute -top-3 right-6">
                <span className="bg-[#a007dc] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  POPULAR
                </span>
              </div>
              <div className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Plată parțială · 2 Rate</div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-white">{INSTALLMENT_PRICE}</span>
                <span className="text-white/50 text-lg">/rată</span>
              </div>
              <div className="text-white/40 text-sm mb-6">{INSTALLMENT_TOTAL} total (2 × {INSTALLMENT_PRICE})</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2.5 text-sm text-white/70">
                  <svg className="w-4 h-4 text-[#a007dc] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Împarte investiția în 2 rate
                </li>
                {PRICING_FEATURES.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                    <svg className="w-4 h-4 text-[#a007dc] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/checkout?product=COURSE&type=installment"
                className="block w-full text-center bg-[#a007dc] text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-[#a007dc]/90 transition-all hover:shadow-lg hover:shadow-[#a007dc]/25"
              >
                Cumpără acum
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CURRICULUM ═══ */}
      <Section variant="white" className="py-20">
        <div className="text-center mb-16">
          <Badge variant="purple" className="mb-4">8 Săptămâni</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-[#51087e] mb-4">
            Ce vei învăța
          </h2>
          <p className="text-[#51087e]/60 max-w-xl mx-auto">
            Fiecare săptămână aduce o perspectivă nouă și instrumente concrete de transformare.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {CURRICULUM.map((item) => (
            <div
              key={item.week}
              className="group relative bg-white border border-[#51087e]/10 rounded-2xl p-6 hover:border-[#a007dc]/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="text-5xl font-black text-[#a007dc]/10 absolute top-3 right-4 group-hover:text-[#a007dc]/20 transition-colors">
                {String(item.week).padStart(2, '0')}
              </div>
              <div className="relative">
                <div className="text-xs font-semibold text-[#a007dc] uppercase tracking-wider mb-2">
                  Săptămâna {item.week}
                </div>
                <h3 className="text-base font-bold text-[#51087e] mb-2">{item.title}</h3>
                <p className="text-sm text-[#51087e]/50 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══ TESTIMONIALS ═══ */}
      <Section variant="light-pink">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#51087e] mb-4">
            Vieți reale. Transformări autentice.
          </h2>
          <p className="text-[#51087e]/60 max-w-xl mx-auto">
            Cursul A.D.O. a schimbat deja perspectiva a zeci de femei care au ales să se pună în centrul propriei realități.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="relative bg-white rounded-2xl p-8 shadow-sm border border-[#a007dc]/10"
            >
              {/* Decorative quote mark */}
              <div className="absolute -top-3 left-6 text-4xl text-[#a007dc]/30 font-serif leading-none">&ldquo;</div>
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, si) => (
                  <svg key={si} className="w-4 h-4 text-amber-400" viewBox="0 0 18 17" fill="currentColor">
                    <path d="M8.164.551a1 1 0 011.672 0l1.826 4.337a1 1 0 00.764.548l4.739.375a1 1 0 01.517 1.572l-3.611 3.056a1 1 0 00-.292.887l1.103 4.57a1 1 0 01-1.453.972l-4.058-2.449a1 1 0 00-.942 0l-4.058 2.449a1 1 0 01-1.453-.972l1.103-4.57a1 1 0 00-.292-.887L.317 7.383a1 1 0 01.517-1.572l4.74-.375a1 1 0 00.763-.548L8.164.551z" />
                  </svg>
                ))}
              </div>
              <p className="text-[#51087e]/80 text-sm leading-relaxed mb-6 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#a007dc] to-[#e0b0ff] flex items-center justify-center text-white font-bold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm text-[#51087e]">{t.name}</div>
                  <div className="text-xs text-[#51087e]/50">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </Section>

      {/* ═══ FAQ ═══ */}
      <Section variant="white" className="py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#51087e] mb-4">
            Ai o curiozitate despre Cursul A.D.O.?
          </h2>
          <p className="text-[#51087e]/60 max-w-xl mx-auto">
            Cel mai probabil vei găsi răspunsul pe care îl cauți mai jos.
          </p>
        </div>
        <div className="max-w-3xl mx-auto" data-testid="faq-section">
          <Accordion items={FAQ_ITEMS} />
        </div>
      </Section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative bg-gradient-to-br from-[#51087e] via-[#51087e] to-[#1a0f3f] py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-[0.03] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ești gata să îți schimbi perspectiva?
          </h2>
          <p className="text-white/60 mb-8 text-lg">
            Alătură-te următoarei ediții a Cursului A.D.O. și începe transformarea.
          </p>
          <Link
            href="/checkout?product=COURSE&type=full"
            className="inline-flex items-center gap-2 bg-[#a007dc] text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-[#a007dc]/90 transition-all hover:shadow-xl hover:shadow-[#a007dc]/25 hover:-translate-y-0.5"
          >
            Înscrie-te acum
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
