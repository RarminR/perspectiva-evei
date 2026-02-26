'use client'

import { useState, useEffect } from 'react'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setVisible(true)
    } else if (consent === 'accepted') {
      // Re-load GA if previously accepted
      loadGA()
    }
  }, [])

  const loadGA = () => {
    if (typeof window === 'undefined') return
    const existing = document.querySelector(
      'script[src*="googletagmanager.com/gtag"]'
    )
    if (existing) return

    const script = document.createElement('script')
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-43N815K6XD'
    script.async = true
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    window.gtag = function (...args: unknown[]) {
      window.dataLayer.push(args)
    }
    window.gtag('js', new Date())
    window.gtag('config', 'G-43N815K6XD')
  }

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
    loadGA()
  }

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#2D1B69] text-white p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm flex-1">
          Folosim cookie-uri pentru a îmbunătăți experiența ta. Prin acceptare,
          ești de acord cu politica noastră de confidențialitate.
        </p>
        <div className="flex gap-3">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm border border-white/30 rounded hover:bg-white/10 transition-colors"
          >
            Refuz
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm bg-[#E91E8C] rounded hover:bg-[#E91E8C]/80 transition-colors font-medium"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
