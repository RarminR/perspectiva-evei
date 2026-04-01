import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Section } from '@/components/ui/Section'

export const metadata: Metadata = {
  title: 'Ședințe 1:1 cu Eva | Perspectiva Evei',
  description:
    'Sedinte individuale de coaching cu Eva Popescu. Indrumare personalizata in manifestare constienta si Legea Asumptiei.',
  openGraph: {
    title: 'Ședințe 1:1 cu Eva | Perspectiva Evei',
    description: 'Coaching personalizat cu Eva Popescu. Sedinte individuale de manifestare constienta.',
    url: 'https://perspectivaevei.com/sedinte-1-la-1',
    siteName: 'Perspectiva Evei',
    locale: 'ro_RO',
    type: 'website',
  },
}

const benefits = [
  {
    icon: '✦',
    title: 'Claritate Personalizata',
    description: 'Analizam impreuna circumstantele tale actuale si identificam exact ce trebuie schimbat pentru a obtine rezultatele dorite.',
  },
  {
    icon: '◈',
    title: 'Ghidare in Manifestare',
    description: 'Inveti cum functioneaza Legea Asumptiei aplicata situatiei tale specifice — nu teorie generala, ci practica reala.',
  },
  {
    icon: '❋',
    title: 'Transformare Constienta',
    description: 'Descoperi cum poti schimba situatiile cu care te confrunti acum prin puterea constiintei si a asumptiei corecte.',
  },
  {
    icon: '✧',
    title: 'Suport Continuu',
    description: 'Primesti instrumente si tehnici pe care le poti aplica imediat, cu rezultate vizibile in viata de zi cu zi.',
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
    title: 'Sedinta',
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
    quote: 'Eva, te iubesc! Daca ai sti cat de mult s-a schimbat tot dupa cursul tau... Voi fi mereu recunoscatoare!',
    name: 'Roxana',
  },
  {
    quote: 'Tu in realitatea mea faci o treaba minunata, realmente schimbi vietile oamenilor iar eu ma bucur cand vad schimbarile pozitive in atatea persoane!',
    name: 'Diana',
  },
]

export default function SedinteOneLaOnePage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section style={{
        backgroundImage: 'linear-gradient(rgba(81,8,126,0.5), rgba(81,8,126,0.5)), linear-gradient(transparent, #51087e), url("/images/Cover-Servicii.jpg")',
        backgroundPosition: '0 0, 0 0, 50%',
        backgroundSize: 'auto, auto, cover',
        padding: '100px 5%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}>
        <div style={{ maxWidth: '940px', width: '100%', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Coaching Personalizat
          </p>
          <h1 style={{
            backgroundImage: 'linear-gradient(90deg, white, #e0e0e0)',
            WebkitTextFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            marginBottom: '1.5rem',
            lineHeight: 1.1,
          }}>
            Ședințe 1:1 cu Eva
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            In sedintele individuale, despicam circumstantele tale actuale, iti explic cum functioneaza
            manifestarea si Legea Asumptiei, cum poti manifesta constient ceea ce traiesti si implicit
            cum poti schimba situatiile cu care te confrunti acum.
          </p>
          <Link href="/programare" style={{
            backgroundColor: 'white',
            border: '1px solid white',
            borderRadius: '999px',
            color: '#51087e',
            padding: '.75rem 2.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1.1rem',
          }}>
            Rezervă o Ședință
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <Section variant="default">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{
            backgroundImage: 'linear-gradient(90deg, #51087e, #8f0edf)',
            WebkitTextFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            fontWeight: 700,
          }}>
            Beneficii
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {benefits.map((b) => (
            <div key={b.title} style={{ backgroundColor: 'rgba(81,8,126,0.15)', borderRadius: '20px', padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: 'white', color: '#51087e', borderRadius: '15px', width: '48px', height: '48px', minWidth: '48px', boxShadow: '0 0 15px rgba(81,8,126,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                {b.icon}
              </div>
              <div>
                <h3 style={{ color: '#51087e', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>{b.title}</h3>
                <p style={{ color: '#444', lineHeight: 1.5, fontSize: '0.85rem', margin: 0 }}>{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section variant="alt">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{
            backgroundImage: 'linear-gradient(90deg, #51087e, #8f0edf)',
            WebkitTextFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            fontWeight: 700,
          }}>
            Cum funcționează
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          {steps.map((s) => (
            <div key={s.number} style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundImage: 'linear-gradient(135deg, #51087e, #a007dc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.1rem',
                margin: '0 auto 1.5rem',
              }}>
                {s.number}
              </div>
              <h3 style={{ color: '#51087e', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.75rem' }}>{s.title}</h3>
              <p style={{ color: '#444', lineHeight: 1.6, fontSize: '0.95rem' }}>{s.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Pricing */}
      <Section variant="dark">
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            backgroundImage: 'linear-gradient(90deg, white, #e0e0e0)',
            WebkitTextFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            fontWeight: 700,
            marginBottom: '1.5rem',
          }}>
            O sedinta, o transformare
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '1rem' }}>
            Fiecare sedinta dureaza aproximativ 60 de minute si este personalizata in functie de nevoile tale specifice.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.05rem', marginBottom: '2rem' }}>
            Contacteaza-ma pentru detalii despre preturi si disponibilitate.
          </p>
          <Link href="/programare" style={{
            backgroundColor: 'white',
            border: '1px solid white',
            borderRadius: '999px',
            color: '#51087e',
            padding: '.75rem 2.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1.1rem',
          }}>
            Rezervă o Ședință
          </Link>
        </div>
      </Section>

      {/* Testimonials */}
      <Section variant="default">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{
            backgroundImage: 'linear-gradient(90deg, #51087e, #8f0edf)',
            WebkitTextFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            fontWeight: 700,
          }}>
            Ce spun clientii mei
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
          {testimonials.map((t) => (
            <div key={t.name} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 4px 20px rgba(81,8,126,0.1)' }}>
              <div style={{ color: '#f59e0b', marginBottom: '1rem', fontSize: '1.1rem' }}>★★★★★</div>
              <p style={{ color: '#444', fontStyle: 'italic', lineHeight: 1.7, marginBottom: '1.5rem' }}>&ldquo;{t.quote}&rdquo;</p>
              <p style={{ color: '#51087e', fontWeight: 700 }}>{t.name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Footer />
    </>
  )
}
