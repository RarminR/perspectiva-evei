import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Analytics', () => {
  let mockGtag: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockGtag = vi.fn()
    vi.stubGlobal('gtag', mockGtag)
    window.gtag = mockGtag
    window.dataLayer = []
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('trackPageView calls gtag with page_view config', async () => {
    const { trackPageView } = await import('./analytics')
    trackPageView('/test-page')
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-43N815K6XD', {
      page_path: '/test-page',
    })
  })

  it('trackEvent calls gtag with correct event name and params', async () => {
    const { trackEvent } = await import('./analytics')
    trackEvent('test_event', { key: 'value' })
    expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', {
      key: 'value',
    })
  })

  it('trackEvent does nothing if gtag not available', async () => {
    // @ts-expect-error - intentionally removing gtag
    delete window.gtag
    const { trackEvent } = await import('./analytics')
    expect(() => trackEvent('test_event')).not.toThrow()
  })

  it('initAnalytics does not throw on client', async () => {
    const { initAnalytics } = await import('./analytics')
    expect(() => initAnalytics()).not.toThrow()
  })

  it('purchase_complete event includes value and currency', async () => {
    const { analytics } = await import('./analytics')
    analytics.purchaseComplete(49.99, 'EUR')
    expect(mockGtag).toHaveBeenCalledWith('event', 'purchase_complete', {
      value: 49.99,
      currency: 'EUR',
    })
  })

  it('guide_opened event includes guide_id', async () => {
    const { analytics } = await import('./analytics')
    analytics.guideOpened('guide-123')
    expect(mockGtag).toHaveBeenCalledWith('event', 'guide_opened', {
      guide_id: 'guide-123',
    })
  })

  it('checkout_started event includes product_name', async () => {
    const { analytics } = await import('./analytics')
    analytics.checkoutStarted('Premium Course')
    expect(mockGtag).toHaveBeenCalledWith('event', 'checkout_started', {
      product_name: 'Premium Course',
    })
  })

  it('video_played event includes lesson_id', async () => {
    const { analytics } = await import('./analytics')
    analytics.videoPlayed('lesson-456')
    expect(mockGtag).toHaveBeenCalledWith('event', 'video_played', {
      lesson_id: 'lesson-456',
    })
  })
})
