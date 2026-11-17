'use client'

import type { CSSProperties } from 'react'

import { OPEN_COOKIE_SETTINGS_EVENT } from '@/components/CookieConsent'

/** Reopens the cookie banner so the visitor can change or withdraw their choice. */
export function CookieSettingsButton({ style }: { style?: CSSProperties }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        font: 'inherit',
        textAlign: 'left',
        ...style,
      }}
    >
      Setări cookie-uri
    </button>
  )
}
