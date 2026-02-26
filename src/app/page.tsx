import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Section } from '@/components/ui/Section'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const testimonials = [
  {
    quote: 'Eva, te iubesc! Dacă ai ști cât de mult s-a schimbat tot după cursul tău... Voi fi mereu recunoscătoare!',
    name: 'Roxana',
    role: 'Cursantă A.D.O.',
  },
  {
    quote: 'Singurul curs care te scoate din întuneric este A.D.O.! MULȚUMESC! TE IUBESC EVA!!!',
    name: 'Loredana',
    role: 'Cursantă A.D.O.',
  },
  {
    quote: 'Chiar este minunat cursul tău. Tu în realitatea mea faci o treabă minunată, realmente schimbi viețile oamenilor!',
    name: 'Andreea',
    role: 'Cursantă A.D.O.',
  },
]

const benefits = [
  {
    title: 'Descoperi cum să trăiești conștient și autentic.',
    icon: '✦',
  },
  {
    title: 'Preiei controlul complet asupra realității tale printr-un proces practic.',
    icon: '◈',
  },
  {
    title: 'Obții îndrumare personalizată, care duce la schimbări reale.',
    icon: '❋',
  },
  {
    title: 'Înveți cum să te raportezi la tine și la tot ceea ce se întâmplă în realitatea ta.',
    icon: '✧',
  },
]

export default function Home() {
  return (
    <main>
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#C4956A]/30 via-[#2D1B69] to-[#2D1B69] text-white py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMC41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-40" />
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 mb-8">
            <Badge variant="pink">4+ ani de experiență</Badge>
            <Badge variant="pink">1000+ ore de coaching</Badge>
            <Badge variant="pink">100+ cursanți mulțumiți</Badge>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight max-w-3xl">
            <span className="bg-gradient-to-r from-[#E91E8C] to-[#FDA4AF] bg-clip-text text-transparent">Totul începe cu tine, </span>
            pentru că totul începe în minte.
          </h1>

          <p className="text-white/80 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">
            Viața pe care o trăiești nu este decât oglinda gândurilor și convingerilor tale.
            Sunt aici să te ghidez pentru a înțelege corect manifestarea conștientă, astfel încât
            tu să alegi conștient o experiență autentică.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/cursul-ado"
              className="inline-flex items-center gap-2 bg-[#E91E8C] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#E91E8C]/90 transition-all hover:shadow-lg hover:shadow-[#E91E8C]/25"
            >
              Descoperă Cursul A.D.O.
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border-2 border-white/30 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:border-white/60 transition-all"
            >
              Contactează-mă
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <Section variant="white">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#2D1B69] mb-4">
            Dacă lucrezi cu mine...
          </h2>
          <p className="text-gray-600 text-lg">Îți vei da seama că totul este doar în puterea ta.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((b) => (
            <Card key={b.title} className="group hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4">
                <span className="text-2xl text-[#E91E8C] shrink-0 mt-1">{b.icon}</span>
                <h3 className="text-[#2D1B69] font-semibold text-lg leading-snug">{b.title}</h3>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/despre-mine"
            className="inline-flex items-center gap-2 bg-[#2D1B69] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#2D1B69]/90 transition"
          >
            Află mai mult
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Section>

      {/* Services Section */}
      <Section variant="light-pink">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#2D1B69] mb-4">
            Serviciile mele
          </h2>
          <p className="text-gray-600 text-lg">Ești gata să mergi la nivelul următor?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="group hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="h-3 bg-gradient-to-r from-[#E91E8C] to-[#FDA4AF] rounded-t-2xl -mx-6 -mt-6 mb-6" />
            <Badge variant="pink" className="mb-4">Max. 15 participanți</Badge>
            <h3 className="text-xl font-bold text-[#2D1B69] mb-3">Cursul A.D.O.!</h3>
            <p className="text-sm text-gray-500 mb-1">Alege! Decide! Observă!</p>
            <p className="text-gray-600 mb-6">
              Un curs de 8 săptămâni, live, cu maxim 15 participanți, pentru cei hotărâți să își transforme complet viața.
            </p>
            <Link href="/cursul-ado" className="text-[#E91E8C] font-semibold hover:underline inline-flex items-center gap-1">
              Află mai mult <span>→</span>
            </Link>
          </Card>

          <Card className="group hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="h-3 bg-gradient-to-r from-[#2D1B69] to-[#E91E8C] rounded-t-2xl -mx-6 -mt-6 mb-6" />
            <Badge variant="purple" className="mb-4">Ghiduri digitale</Badge>
            <h3 className="text-xl font-bold text-[#2D1B69] mb-3">Ghiduri</h3>
            <p className="text-sm text-gray-500 mb-1">Pas cu pas spre transformare</p>
            <p className="text-gray-600 mb-6">
              Ghiduri create pentru a te ajuta să preiei controlul asupra vieții tale, pas cu pas.
            </p>
            <Link href="/ghiduri" className="text-[#E91E8C] font-semibold hover:underline inline-flex items-center gap-1">
              Află mai mult <span>→</span>
            </Link>
          </Card>

          <Card className="group hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="h-3 bg-gradient-to-r from-[#C4956A] to-[#E91E8C] rounded-t-2xl -mx-6 -mt-6 mb-6" />
            <Badge variant="purple" className="mb-4">Îndrumare personalizată</Badge>
            <h3 className="text-xl font-bold text-[#2D1B69] mb-3">Ședințe 1:1</h3>
            <p className="text-sm text-gray-500 mb-1">O oră în care îți amintești cine ești</p>
            <p className="text-gray-600 mb-6">
              Îndrumare adaptată nevoilor tale, pentru transformări reale.
            </p>
            <Link href="/sedinte-1-la-1" className="text-[#E91E8C] font-semibold hover:underline inline-flex items-center gap-1">
              Află mai mult <span>→</span>
            </Link>
          </Card>
        </div>
      </Section>

      {/* Testimonials */}
      <Section variant="dark">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#E91E8C] to-[#FDA4AF] bg-clip-text text-transparent">
              Ce spun clienții mei?
            </span>
          </h2>
          <p className="text-white/70 text-lg">Vieți schimbate și transformări reale.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <Card key={t.name} variant="testimonial" className="bg-white/5 border-white/10 backdrop-blur-sm">
              <div className="flex gap-1 mb-4 text-yellow-400">
                {'★★★★★'.split('').map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </div>
              <p className="text-white/90 italic mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="border-t border-white/10 pt-4">
                <p className="text-white font-semibold">{t.name}</p>
                <p className="text-white/50 text-sm">{t.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <Section variant="desert">
        <div className="text-center py-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#2D1B69] mb-4">
            E timpul să preiei controlul.
          </h2>
          <p className="text-gray-700 text-lg mb-8 max-w-xl mx-auto">
            Ești Creatorul realității tale. Hai să descoperim asta împreună.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/cursul-ado"
              className="inline-flex items-center gap-2 bg-[#E91E8C] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#E91E8C]/90 transition-all hover:shadow-lg hover:shadow-[#E91E8C]/25"
            >
              Începe cu Cursul A.D.O.
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/ghiduri"
              className="inline-flex items-center gap-2 border-2 border-[#2D1B69] text-[#2D1B69] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#2D1B69] hover:text-white transition-all"
            >
              Explorează ghidurile
            </Link>
          </div>
        </div>
      </Section>

      <Footer />
    </main>
  )
}
