import type { Metadata } from 'next'
import './globals.css'
import CookieConsent from '@/components/CookieConsent'

export const metadata: Metadata = {
  title: 'Perspectiva Evei',
  description: 'Coaching platform for manifestation and personal development',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro">
      <body className="bg-brand-purple-dark text-white">
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
