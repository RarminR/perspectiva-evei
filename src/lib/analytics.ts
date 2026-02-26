const GA_MEASUREMENT_ID = 'G-43N815K6XD'

export function initAnalytics() {
  if (typeof window === 'undefined') return
  // gtag is loaded via CookieConsent component after user accepts
}

export function trackPageView(url: string) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: url })
}

export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', eventName, params)
}

// Typed event helpers
export const analytics = {
  purchaseComplete: (value: number, currency = 'EUR') =>
    trackEvent('purchase_complete', { value, currency }),
  checkoutStarted: (productName: string) =>
    trackEvent('checkout_started', { product_name: productName }),
  guideOpened: (guideId: string) =>
    trackEvent('guide_opened', { guide_id: guideId }),
  videoPlayed: (lessonId: string) =>
    trackEvent('video_played', { lesson_id: lessonId }),
}

// Extend Window type for gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}
