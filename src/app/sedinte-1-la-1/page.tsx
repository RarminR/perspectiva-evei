import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/ui'
import { Footer } from '@/components/ui'
import { Section } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Ședințe 1:1 cu Eva | Perspectiva Evei',
  description:
    'Ședințe individuale de coaching cu Eva Popescu. Îndrumare personalizată în manifestare conștientă și Legea Asumpției.',
  openGraph: {
    title: 'Ședințe 1:1 cu Eva | Perspectiva Evei',
    description:
      'Coaching personalizat cu Eva Popescu. Ședințe individuale de manifestare conștientă.',
    url: 'https://perspectivaevei.com/sedinte-1-la-1',
    siteName: 'Perspectiva Evei',
    locale: 'ro_RO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ședințe 1:1 cu Eva | Perspectiva Evei',
    description:
      'Coaching personalizat cu Eva Popescu. Ședințe individuale de manifestare conștientă.',
  },
}
const benefits = [
  {
    icon: '✦',
    title: 'Claritate Personalizată',
    description: 'Analizăm împreună circumstanțele tale actuale și identificăm exact ce trebuie schimbat pentru a obține rezultatele dorite.',
  },
  {
    icon: '◈',
    title: 'Ghidare în Manifestare',
    description: 'Înveți cum funcționează Legea Asumpției aplicată situației tale specifice — nu teorie generală, ci practică reală.',
  },
  {
    icon: '❋',
    title: 'Transformare Conștientă',
    description: 'Descoperi cum poți schimba situațiile cu care te confrunți acum prin puterea conștiinței și a asumpției corecte.',
  },
  {
    icon: '✧',
    title: 'Suport Continuu',
    description: 'Primești instrumente și tehnici pe care le poți aplica imediat, cu rezultate vizibile în viața de zi cu zi.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Programează',
    description: 'Alege o dată și o oră convenabilă pentru tine. Ședințele se desfășoară online, pe Zoom.',
  },
  {
    number: '02',
    title: 'Ședința',
    description: 'În 60 de minute, lucrăm împreună pe situația ta. Primești claritate, direcție și tehnici concrete.',
  },
  {
    number: '03',
    title: 'Transformă',
    description: 'Aplici ce ai învățat și observi cum realitatea ta începe să se schimbe. Rezultatele vin natural.',
  },
]

const testimonials = [
  {
    quote: 'Eva, te iubesc! Dacă ai ști cât de mult s-a schimbat tot după cursul tău... Voi fi mereu recunoscătoare!',
    name: 'Roxana',
    role: 'Clientă mulțumită',
  },
  {
    quote: 'Tu în realitatea mea faci o treabă minunată, realmente schimbi viețile oamenilor iar eu mă bucur când văd schimbările pozitive în atâtea persoane!',
    name: 'Diana',
    role: 'Clientă mulțumită',
  },
]

export default function SedinteOneLaOnePage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className="relative bg-[#2D1B69] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(233,30,140,0.15),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(253,164,175,0.1),_transparent_50%)]" />
        <div className="relative max-w-5xl mx-auto px-4 py-24 md:py-32 text-center">
          <p className="text-[#FDA4AF] font-medium tracking-widest uppercase text-sm mb-4">Coaching Personalizat</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[#E91E8C] to-[#FDA4AF] bg-clip-text text-transparent">Ședințe 1:1</span>
            {' '}cu Eva
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            În ședințele individuale, despicăm circumstanțele tale actuale, îți explic cum funcționează
            manifestarea și Legea Asumpției, cum poți manifesta conștient ceea ce trăiești și implicit
            cum poți schimba situațiile cu care te confrunți acum.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#E91E8C] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#E91E8C]/90 transition-all hover:shadow-lg hover:shadow-[#E91E8C]/25"
          >
            Rezervă o Ședință
            <span className="text-xl">→</span>
          </Link>
        </div>
      </div>

      {/* Benefits */}
      <Section variant="light-pink">
        <div className="text-center mb-16">
          <p className="text-[#E91E8C] font-medium tracking-widest uppercase text-sm mb-3">De ce să alegi</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2D1B69]">Beneficii</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((b) => (
            <div key={b.title} className="bg-white rounded-2xl p-8 shadow-sm border border-[#E91E8C]/10 hover:shadow-md hover:border-[#E91E8C]/20 transition-all">
              <span className="text-3xl text-[#E91E8C] block mb-4">{b.icon}</span>
              <h3 className="text-xl font-bold text-[#2D1B69] mb-3">{b.title}</h3>
              <p className="text-gray-600 leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section variant="white">
        <div className="text-center mb-16">
          <p className="text-[#E91E8C] font-medium tracking-widest uppercase text-sm mb-3">Proces simplu</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2D1B69]">Cum funcționează</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((s) => (
            <div key={s.number} className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E91E8C] to-[#FDA4AF] flex items-center justify-center text-white font-bold text-lg mx-auto mb-6">
                {s.number}
              </div>
              <h3 className="text-xl font-bold text-[#2D1B69] mb-3">{s.title}</h3>
              <p className="text-gray-600 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Pricing */}
      <Section variant="dark">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[#FDA4AF] font-medium tracking-widest uppercase text-sm mb-3">Investiția ta</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">O ședință, o transformare</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 backdrop-blur-sm">
            <p className="text-white/70 text-lg mb-6 leading-relaxed">
              Fiecare ședință durează aproximativ 60 de minute și este personalizată
              în funcție de nevoile tale specifice.
            </p>
            <p className="text-white/90 text-lg mb-8">
              Contactează-mă pentru detalii despre prețuri și disponibilitate.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-[#E91E8C] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#E91E8C]/90 transition-all hover:shadow-lg hover:shadow-[#E91E8C]/25"
            >
              Rezervă o Ședință
              <span className="text-xl">→</span>
            </Link>
          </div>
        </div>
      </Section>

      {/* Testimonials */}
      <Section variant="light-pink">
        <div className="text-center mb-16">
          <p className="text-[#E91E8C] font-medium tracking-widest uppercase text-sm mb-3">Ce spun clienții mei</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2D1B69]">Vieți schimbate</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl p-8 shadow-sm border border-[#E91E8C]/10">
              <div className="flex gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-lg">★</span>
                ))}
              </div>
              <p className="text-gray-700 italic mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="font-semibold text-[#2D1B69]">{t.name}</p>
                <p className="text-sm text-gray-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Footer />
    </>
  )
}
