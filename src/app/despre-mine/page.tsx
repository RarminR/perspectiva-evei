import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Section } from '@/components/ui/Section'

export const metadata: Metadata = {
  title: 'Despre Eva Popescu | Perspectiva Evei',
  description: 'Afla povestea Evei Popescu, coach de manifestare constienta cu peste 4 ani de experienta si 1000+ ore de coaching.',
  openGraph: {
    title: 'Despre Eva Popescu | Perspectiva Evei',
    description: 'Coach de manifestare constienta cu peste 4 ani de experienta.',
    url: 'https://perspectivaevei.com/despre-mine',
    siteName: 'Perspectiva Evei',
    locale: 'ro_RO',
    type: 'profile',
  },
}

const credentials = [
  {
    icon: '✦',
    title: 'Coach de manifestare constienta',
    description: 'Specializare in tehnici de schimbare a convingerilor si manifestare bazata pe identitate.',
  },
  {
    icon: '◈',
    title: '4+ ani de experienta',
    description: 'Peste 1000 de ore de coaching individual si de grup cu rezultate transformatoare.',
  },
  {
    icon: '❋',
    title: 'Cursul A.D.O. — 10 editii',
    description: 'Peste 100 de cursanti care au trecut prin programul de 8 saptamani.',
  },
  {
    icon: '✧',
    title: 'Autoare de ghiduri',
    description: 'Ghiduri digitale pentru identitate, credinte si manifestarea persoanei specifice.',
  },
]

export default function DespreMine() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section style={{
        backgroundImage: 'linear-gradient(#51087e, #a62bf1)',
        padding: '120px 5%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '940px', width: '100%' }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Despre mine
          </p>
          <h1 style={{
            backgroundImage: 'linear-gradient(90deg, white, #e0e0e0)',
            WebkitTextFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            marginBottom: '1rem',
          }}>
            Eva Popescu
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.2rem' }}>
            Coach de manifestare si constiinta
          </p>
        </div>
      </section>

      {/* Story */}
      <Section variant="default">
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{
            backgroundImage: 'linear-gradient(90deg, #51087e, #8f0edf)',
            WebkitTextFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            fontWeight: 700,
            marginBottom: '2rem',
          }}>
            Povestea mea
          </h2>
          <div style={{ color: '#444', lineHeight: 1.8, fontSize: '1.05rem' }}>
            <p style={{ marginBottom: '1.5rem' }}>
              Am inceput aceasta calatorie din dorinta de a intelege cu adevarat cum functioneaza realitatea
              pe care o traim. Dupa ani de cautari, am descoperit ca totul incepe cu identitatea noastra —
              cu povestea pe care ne-o spunem despre noi insine.
            </p>
            <p style={{ marginBottom: '1.5rem' }}>
              Manifestarea constienta nu este despre tehnici, afirmatii sau meditatii. Este despre a
              intelege cine esti cu adevarat si a alege constient experienta pe care vrei sa o traiesti.
              Aceasta este esenta muncii mele.
            </p>
            <p style={{ marginBottom: '1.5rem' }}>
              Am creat <strong style={{ color: '#51087e' }}>Cursul A.D.O. (Alege! Decide! Observa!)</strong> pentru a oferi un cadru
              practic si profund celor care sunt gata sa preia controlul asupra vietii lor. Fiecare editie
              este limitata la maximum 15 participanti, pentru a asigura indrumare personalizata.
            </p>
            <p>
              Ghidurile mele — <em>&ldquo;Cine Manifesta?!&rdquo;</em>, <em>&ldquo;Este despre mine!&rdquo;</em>
              si <em>&ldquo;Este (tot) despre mine!&rdquo;</em> — sunt instrumente create pentru a te ajuta
              sa faci primii pasi spre o viata traita constient.
            </p>
          </div>
        </div>
      </Section>

      {/* Mission */}
      <Section variant="alt">
        <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            backgroundImage: 'linear-gradient(90deg, #51087e, #8f0edf)',
            WebkitTextFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            fontWeight: 700,
            marginBottom: '1.5rem',
          }}>
            Misiunea mea
          </h2>
          <p style={{ color: '#444', fontSize: '1.1rem', lineHeight: 1.8 }}>
            Sa te ghidez pentru a intelege corect manifestarea constienta, astfel incat tu sa alegi
            constient o experienta autentica. E timpul sa preiei controlul si sa-ti amintesti cine
            esti cu adevarat: <strong style={{ color: '#51087e' }}>Creatorul realitatii tale.</strong>
          </p>
        </div>
      </Section>

      {/* Credentials */}
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
            Experienta si certificari
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {credentials.map((c) => (
            <div key={c.title} style={{ backgroundColor: 'rgba(81,8,126,0.15)', borderRadius: '20px', padding: '30px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: 'white', color: '#51087e', borderRadius: '15px', width: '60px', height: '60px', boxShadow: '0 0 15px rgba(81,8,126,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.5rem' }}>
                {c.icon}
              </div>
              <div>
                <h3 style={{ color: '#51087e', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>{c.title}</h3>
                <p style={{ color: '#444', lineHeight: 1.6, fontSize: '0.9rem' }}>{c.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section variant="dark">
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            backgroundImage: 'linear-gradient(90deg, white, #e0e0e0)',
            WebkitTextFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            fontWeight: 700,
            marginBottom: '1rem',
          }}>
            Hai sa lucram impreuna
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
            Fie ca alegi cursul, un ghid sau o sedinta individuala, sunt aici pentru tine.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/cursul-ado" style={{
              backgroundColor: 'white',
              border: '1px solid white',
              borderRadius: '999px',
              color: '#51087e',
              padding: '.75rem 2rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            }}>
              Cursul A.D.O.
            </Link>
            <Link href="/contact" style={{
              backgroundColor: 'transparent',
              border: '1px solid white',
              borderRadius: '999px',
              color: 'white',
              padding: '.75rem 2rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            }}>
              Contacteaza-ma
            </Link>
          </div>
        </div>
      </Section>

      <Footer />
    </>
  )
}
