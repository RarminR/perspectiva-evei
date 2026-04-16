import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Section } from '@/components/ui/Section'

export const metadata: Metadata = {
  title: 'Ședințe 1:1 cu Eva | Perspectiva Evei',
  description:
    'Ședințe individuale de coaching cu Eva Popescu. Îndrumare personalizată în manifestare conștientă și Legea Asumpției.',
  openGraph: {
    title: 'Ședințe 1:1 cu Eva | Perspectiva Evei',
    description: 'Coaching personalizat cu Eva Popescu. Ședințe individuale de manifestare conștientă.',
    url: 'https://perspectivaevei.com/sedinte-1-la-1',
    siteName: 'Perspectiva Evei',
    locale: 'ro_RO',
    type: 'website',
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
    description: 'Înveți cum funcționează Legea Asumpției aplicată situației tale specifice - nu teorie generală, ci practică reală.',
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
    quote: 'Am venit în curs confuză și blocată. În câteva săptămâni am învățat să-mi schimb complet raportarea și să aleg conștient ce trăiesc.',
    name: 'Roxana M.',
    role: 'Antreprenoare',
  },
  {
    quote: 'Cel mai valoros lucru pentru mine a fost claritatea. Nu mai alerg după tehnici, ci îmi asum postura de creator în fiecare zi.',
    name: 'Loredana P.',
    role: 'Manager HR',
  },
  {
    quote: 'Fiecare sesiune a fost practică, aplicată și directă. Rezultatele au apărut atât în relații, cât și în felul în care mă văd pe mine.',
    name: 'Andreea C.',
    role: 'Consultant',
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
            Coaching Individual
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
            În ședințele individuale, despicăm circumstanțele tale actuale, îți explic cum
            funcționează manifestarea și Legea Asumpției, cum poți manifesta conștient ceea ce
            trăiești și implicit cum poți schimba situațiile cu care te confrunți acum.
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
            Programează ședință
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <Section variant="default" style={{ padding: '60px 30px' }}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
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
      <Section variant="alt" style={{ padding: '60px 30px' }}>
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
      <Section variant="dark" style={{ padding: '60px 30px' }}>
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
            60 de minute. O viață transformată.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
            Investește această oră și descoperă cât de simplu este să trăiești o realitate complet transformată.
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
            Programează ședință
          </Link>
        </div>
      </Section>

      {/* Testimonials */}
      <Section variant="default" style={{ padding: '60px 30px' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{
            backgroundImage: 'linear-gradient(90deg, #51087e, #8f0edf)',
            WebkitTextFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            fontWeight: 700,
          }}>
            Ce spun clienții mei?
          </h2>
        </div>
        <div
          style={{ display: 'grid', gap: '30px' }}
          className="grid-cols-1 md:grid-cols-3"
        >
          {testimonials.map((item) => (
            <div
              key={item.name}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '30px',
                boxShadow: '0 16px 30px rgba(81,8,126,0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                height: '100%',
              }}
            >
              <div style={{ display: 'flex', gap: '4px', color: '#f59e0b' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.16379 0.551109C8.47316 -0.183704 9.52684 -0.183703 9.83621 0.551111L11.6621 4.88811C11.7926 5.19789 12.0875 5.40955 12.426 5.43636L17.1654 5.81173C17.9684 5.87533 18.294 6.86532 17.6822 7.38306L14.0713 10.4388C13.8134 10.6571 13.7007 10.9996 13.7795 11.3259L14.8827 15.8949C15.0696 16.669 14.2172 17.2809 13.5297 16.8661L9.47208 14.4176C9.18225 14.2427 8.81775 14.2427 8.52793 14.4176L4.47029 16.8661C3.7828 17.2809 2.93036 16.669 3.11727 15.8949L4.22048 11.3259C4.29928 10.9996 4.18664 10.6571 3.92873 10.4388L0.317756 7.38306C-0.294046 6.86532 0.0315611 5.87533 0.834562 5.81173L5.57402 5.43636C5.91255 5.40955 6.20744 5.19789 6.33786 4.88811L8.16379 0.551109Z" fill="currentColor" />
                  </svg>
                ))}
              </div>
              <p style={{ margin: 0, color: '#2c0246', fontStyle: 'italic', lineHeight: 1.65 }}>
                &ldquo;{item.quote}&rdquo;
              </p>
              <div style={{ borderTop: '1px solid rgba(81,8,126,0.16)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '999px',
                      backgroundImage: 'linear-gradient(135deg, #51087e, #a007dc)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {item.name[0]}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: '#2c0246' }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6f5a81' }}>{item.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Footer />
    </>
  )
}
