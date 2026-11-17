import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

import CookieConsent, { OPEN_COOKIE_SETTINGS_EVENT } from '../CookieConsent'

function clearCookies() {
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0].trim()
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`
  }
}

function consentCookie() {
  const m = document.cookie.match(/(?:^|;\s*)pe_consent=([^;]+)/)
  return m ? JSON.parse(decodeURIComponent(m[1])) : null
}

describe('CookieConsent', () => {
  beforeEach(() => {
    clearCookies()
    document.head.querySelectorAll('script').forEach((s) => s.remove())
    ;(window as any).dataLayer = []
  })

  it('asks on the first visit and loads nothing before a choice', () => {
    render(<CookieConsent />)
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull()
    expect(screen.getByText('Politica de cookies').getAttribute('href')).toBe(
      'https://www.perspectivaevei.com/setari-cookie-uri'
    )
  })

  it('"Doar necesare" stores the refusal and keeps Google Analytics off', () => {
    render(<CookieConsent />)
    fireEvent.click(screen.getByText('Doar necesare'))
    expect(consentCookie()).toMatchObject({ v: 1, a: false })
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('"Accept toate" stores the consent and loads Google Analytics', () => {
    render(<CookieConsent />)
    fireEvent.click(screen.getByText('Accept toate'))
    expect(consentCookie()).toMatchObject({ v: 1, a: true })
    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js?id=G-43N815K6XD"]')).not.toBeNull()
  })

  it('reopens from "Setări cookie-uri" so the choice can be changed', () => {
    render(<CookieConsent />)
    fireEvent.click(screen.getByText('Doar necesare'))
    expect(screen.queryByRole('dialog')).toBeNull()
    act(() => {
      window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))
    })
    expect(screen.getByRole('dialog')).toBeTruthy()
  })
})
