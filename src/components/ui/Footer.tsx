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
                  { href: '/cursul-ado', label: 'Cursul A.D.O.' },
                  { href: '/ghiduri', label: 'Ghiduri' },
                  { href: '/sedinte-1-la-1', label: 'Ședințe 1:1' },
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
                  { href: '/politica-de-confidentialitate', label: 'Politica de confidențialitate' },
                  { href: '/termeni-si-conditii', label: 'Termeni și condiții' },
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

        {/* Divider */}
        <div style={{ backgroundColor: '#f8f9fa', width: '100%', height: '1px', marginBottom: '1.5rem' }} />

        {/* Bottom wrapper */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ color: 'rgba(248,249,250,0.6)', fontSize: '0.875rem', margin: 0 }}>
            © 2025 Perspectiva Evei. Toate drepturile rezervate.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/politica-de-confidentialitate" style={{ color: '#f8f9fa', fontSize: '0.875rem', textDecoration: 'underline', transition: 'color .3s' }}>
              Politica de confidențialitate
            </Link>
            <Link href="/termeni-si-conditii" style={{ color: '#f8f9fa', fontSize: '0.875rem', textDecoration: 'underline', transition: 'color .3s' }}>
              Termeni și condiții
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
