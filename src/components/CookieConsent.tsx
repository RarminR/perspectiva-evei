'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Bannerul de cookie-uri al platformei (Legea 506/2004 art. 4 alin. (5), GDPR).
 * Același format ca pe www.perspectivaevei.com: cookie `pe_consent`, 6 luni, versiune 1.
 * Google Analytics se încarcă doar după acord (Consent Mode v2 „basic”).
 * Alegerea se poate schimba oricând din „Setări cookie-uri” (subsolul paginii).
 */
const GA_ID = 'G-43N815K6XD'
const COOKIE = 'pe_consent'
const VERSION = 1 // +1 la o schimbare importantă (scop sau furnizor nou): toți utilizatorii sunt întrebați din nou
const DAYS = 180
export const OPEN_COOKIE_SETTINGS_EVENT = 'pe:open-cookie-settings'

type Consent = { v: number; a: boolean; t: string }

function readConsent(): Consent | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))
    const consent = match ? (JSON.parse(decodeURIComponent(match[1])) as Consent) : null
    return consent && consent.v === VERSION ? consent : null
  } catch {
    return null
  }
}

function writeConsent(analytics: boolean) {
  const consent: Consent = { v: VERSION, a: analytics, t: new Date().toISOString() }
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(consent))}; Max-Age=${DAYS * 86400}; Path=/; SameSite=Lax${secure}`
}

function gtag(..._args: unknown[]) {
  window.dataLayer = window.dataLayer || []
  // gtag.js expects the `arguments` object itself, not an array
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments)
}

function enableAnalytics() {
  ;(window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = false
  gtag('consent', 'update', { analytics_storage: 'granted' })
  if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return
  window.gtag = gtag
  const script = document.createElement('script')
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  script.async = true
  document.head.appendChild(script)
  gtag('js', new Date())
  gtag('config', GA_ID)
}

function disableAnalytics() {
  ;(window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = true
  gtag('consent', 'update', { analytics_storage: 'denied' })
  // Remove the Google Analytics cookies set on this host or on .perspectivaevei.com
  const names = document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter((name) => name === '_ga' || name.startsWith('_ga_'))
  const host = window.location.hostname
  const parent = host.split('.').slice(-2).join('.')
  for (const name of names) {
    for (const domain of ['', `; Domain=${host}`, `; Domain=.${parent}`]) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domain}`
    }
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted',
    })
    try {
      // The previous banner stored a choice under a different key and wording; ask again.
      localStorage.removeItem('cookie-consent')
    } catch {
      /* storage unavailable */
    }
    const consent = readConsent()
    if (!consent) {
      setVisible(true)
    } else if (consent.a) {
      enableAnalytics()
    } else {
      ;(window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = true
    }

    const open = () => setVisible(true)
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open)
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open)
  }, [])

  const choose = useCallback((analytics: boolean) => {
    const previous = readConsent()
    writeConsent(analytics)
    setVisible(false)
    if (analytics) {
      enableAnalytics()
    } else {
      disableAnalytics()
      // Google Analytics may already be running from an earlier "accept": reload to stop it.
      if (previous?.a) window.location.reload()
    }
  }, [])

  if (!visible) return null

  const buttonClass =
    'px-4 py-2 text-sm rounded border border-white bg-white text-[#51087e] font-semibold hover:bg-white/90 transition-colors'

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Setări cookie-uri"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#51087e] text-white p-4 shadow-lg"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm flex-1">
          Folosim cookie-uri necesare pentru cont și pentru funcționarea platformei. Cu acordul tău,
          folosim și Google Analytics, ca să vedem cum este folosită platforma. Poți schimba alegerea
          oricând, din „Setări cookie-uri”, în subsolul paginii. Detalii în{' '}
          <a
            href="https://www.perspectivaevei.com/setari-cookie-uri"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Politica de cookies
          </a>
          .
        </p>
        <div className="flex gap-3 shrink-0">
          <button type="button" onClick={() => choose(false)} className={buttonClass}>
            Doar necesare
          </button>
          <button type="button" onClick={() => choose(true)} className={buttonClass}>
            Accept toate
          </button>
        </div>
      </div>
    </div>
  )
}
