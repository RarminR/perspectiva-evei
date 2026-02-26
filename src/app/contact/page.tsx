import type { Metadata } from 'next'
import ContactContent from './ContactContent'

export const metadata: Metadata = {
  title: 'Contact | Perspectiva Evei',
  description:
    'Contactează-o pe Eva Popescu. Trimite un mesaj pentru întrebări despre cursuri, ghiduri sau ședințe de coaching.',
  openGraph: {
    title: 'Contact | Perspectiva Evei',
    description:
      'Contactează-o pe Eva Popescu pentru întrebări despre coaching și manifestare conștientă.',
    url: 'https://perspectivaevei.com/contact',
    siteName: 'Perspectiva Evei',
    locale: 'ro_RO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact | Perspectiva Evei',
    description:
      'Contactează-o pe Eva Popescu pentru întrebări despre coaching și manifestare conștientă.',
  },
}

export default function ContactPage() {
  return <ContactContent />
}
