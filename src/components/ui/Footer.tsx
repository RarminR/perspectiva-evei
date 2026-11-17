import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer style={{
      backgroundColor: '#212529',
      backgroundImage: 'linear-gradient(180deg, #51087e, #2c0246)',
      color: '#f8f9fa',
    }}>
      <div style={{ maxWidth: '940px', margin: '0 auto', padding: '5%' }}>
        {/* Top wrapper — 2 col grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4vw',
          alignItems: 'start',
          marginBottom: '3rem',
        }}>
          {/* Left — logo + tagline */}
          <div>
            <Link href="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>
              <Image
                src="/logo-stacked.svg"
                alt="Perspectiva Evei"
                width={160}
                height={80}
                style={{ width: '10rem', height: 'auto' }}
              />
            </Link>
            <p style={{ color: 'rgba(248,249,250,0.6)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              Transformare prin conștiință și manifestare conștientă.
            </p>
          </div>

          {/* Right — 2-col menu grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            alignItems: 'start',
          }}>
            {/* Servicii */}
            <div>
              <p style={{ color: '#f8f9fa', fontWeight: 600, fontSize: '0.875rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Servicii
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { href: '/cursul-ado', label: 'Cursul A.D.O.!' },
                  { href: '/ghiduri', label: 'Ghiduri' },
                  { href: 'https://www.perspectivaevei.com/sedinte-1-la-1', label: 'Ședințe 1:1' },
                  { href: '/blog', label: 'Blog' },
                  { href: 'https://www.perspectivaevei.com/', label: 'Despre mine' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{ color: '#f8f9fa', fontSize: '0.875rem', fontWeight: 400, textDecoration: 'none', transition: 'color .3s' }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <p style={{ color: '#f8f9fa', fontWeight: 600, fontSize: '0.875rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Legal
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { href: '/contact', label: 'Contact' },
                  { href: 'https://www.perspectivaevei.com/politica-de-confidentialitate', label: 'Politica de confidențialitate' },
                  { href: 'https://www.perspectivaevei.com/setari-cookie-uri', label: 'Politica de cookies' },
                  { href: 'https://www.perspectivaevei.com/termeni-si-conditii', label: 'Termeni și condiții' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{ color: '#f8f9fa', fontSize: '0.875rem', fontWeight: 400, textDecoration: 'none', transition: 'color .3s' }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ANPC — Ordinul 449/2022 modificat prin Ordinul 270/2026: doar pictograma SAL, 250x50 px, link către reclamatiisal.anpc.ro */}
        <div style={{ marginBottom: '1.5rem' }}>
          <a
            href="https://reclamatiisal.anpc.ro/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block' }}
          >
            <Image
              src="/images/anpc-sal.png"
              alt="ANPC - Soluționarea alternativă a litigiilor (SAL)"
              width={250}
              height={50}
              style={{ width: '250px', height: '50px', objectFit: 'contain', objectPosition: 'left center', display: 'block' }}
            />
          </a>
        </div>

        {/* Divider */}
        <div style={{ backgroundColor: '#f8f9fa', width: '100%', height: '1px', marginBottom: '1.5rem' }} />

        {/* Bottom wrapper */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ color: 'rgba(248,249,250,0.6)', fontSize: '0.875rem', margin: 0 }}>
              © {new Date().getFullYear()} Perspectiva Evei. Toate drepturile rezervate.
            </p>
            {/* Identificarea comerciantului (Legea 365/2002 art. 5, Legea 31/1990 art. 74), ca în footerul site-ului */}
            <p style={{ color: 'rgba(248,249,250,0.6)', fontSize: '0.75rem', lineHeight: 1.5, margin: '0.5rem 0 0' }}>
              Platformă operată de DECOR-IUTA S.R.L. · Sediu social: Str. Poștei nr. 30, Ploiești, jud. Prahova ·
              Nr. Reg. Com.: J29/2879/25.11.2021 · EUID: ROONRC.J29/2879/2021 · CUI: 45280156 · Capital social: 200 lei ·
              E-mail: <a href="mailto:estedespremine@gmail.com" style={{ color: 'inherit' }}>estedespremine@gmail.com</a>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link href="https://www.perspectivaevei.com/politica-de-confidentialitate" style={{ color: '#f8f9fa', fontSize: '0.875rem', textDecoration: 'underline', transition: 'color .3s' }}>
              Politica de confidențialitate
            </Link>
            <Link href="https://www.perspectivaevei.com/setari-cookie-uri" style={{ color: '#f8f9fa', fontSize: '0.875rem', textDecoration: 'underline', transition: 'color .3s' }}>
              Politica de cookies
            </Link>
            <Link href="https://www.perspectivaevei.com/termeni-si-conditii" style={{ color: '#f8f9fa', fontSize: '0.875rem', textDecoration: 'underline', transition: 'color .3s' }}>
              Termeni și condiții
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
