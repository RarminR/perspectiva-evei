import type { Metadata } from 'next'

import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { WithdrawalForm } from './WithdrawalForm'

export const metadata: Metadata = {
  title: 'Retragere din contract | Perspectiva Evei',
  description:
    'Retrage-te online din contractul încheiat pe platforma Perspectiva Evei, în termenul de 14 zile.',
  robots: { index: false, follow: true },
}

export default function RetragerePage() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '7rem 1.25rem 4rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#51087e', marginBottom: '1rem' }}>
          Retragere din contract
        </h1>
        <p style={{ color: '#374151', lineHeight: 1.6, marginBottom: '0.75rem' }}>
          Ai dreptul să te retragi din contract în 14 zile de la încheierea lui, fără să spui motivul.
          Completează datele de mai jos și apasă „Confirmă retragerea aici”. Îți trimitem pe e-mail
          confirmarea, cu conținutul declarației și data și ora la care am primit-o.
        </p>
        <p style={{ color: '#374151', lineHeight: 1.6, marginBottom: '2rem' }}>
          Condițiile complete, inclusiv pentru ghidurile la care ai cerut acces imediat, sunt în{' '}
          <a
            href="https://www.perspectivaevei.com/termeni-si-conditii"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#51087e', textDecoration: 'underline' }}
          >
            Termenii și condițiile
          </a>
          , secțiunea 6. Poți folosi și formularul model de acolo sau ne poți scrie la
          estedespremine@gmail.com.
        </p>
        <WithdrawalForm />
      </main>
      <Footer />
    </>
  )
}
