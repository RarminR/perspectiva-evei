import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/constants/pricing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants/pricing')>()
  return { ...actual, COURSE_PROMO: { ...actual.COURSE_PROMO, enabled: true, applyInCode: true } }
})

import { applyCoursePromo, chargedCoursePrice, formatEur, isCoursePromoActive } from './course-promo'

// Black Friday 2026 window: 19 Nov 00:00 → 22 Nov 23:59:59 Romania time (UTC+2).
const BEFORE = new Date('2026-11-18T21:59:59Z') // 18 Nov, 23:59:59 in Romania
const START = new Date('2026-11-18T22:00:00Z') // 19 Nov, 00:00 in Romania
const LAST_SECOND = new Date('2026-11-22T21:59:59Z') // 22 Nov, 23:59:59 in Romania
const END = new Date('2026-11-22T22:00:00Z') // 23 Nov, 00:00 in Romania

describe('course promotion window', () => {
  it('opens at 19 Nov 00:00 and closes at 23 Nov 00:00, Romania time', () => {
    expect(isCoursePromoActive(BEFORE)).toBe(false)
    expect(isCoursePromoActive(START)).toBe(true)
    expect(isCoursePromoActive(LAST_SECOND)).toBe(true)
    expect(isCoursePromoActive(END)).toBe(false)
  })

  it('takes 20% off €1.188 to €950,40', () => {
    expect(applyCoursePromo(1188)).toBe(950.4)
  })

  it('discounts only full payment, only inside the window', () => {
    expect(chargedCoursePrice(1188, 'full', START)).toBe(950.4)
    expect(chargedCoursePrice(1188, 'full', BEFORE)).toBe(1188)
    expect(chargedCoursePrice(1188, 'full', END)).toBe(1188)
    expect(chargedCoursePrice(644, 'installment', START)).toBe(644)
  })
})

describe('formatEur', () => {
  it('formats like the site', () => {
    expect(formatEur(1188)).toBe('€1.188')
    expect(formatEur(950.4)).toBe('€950,40')
    expect(formatEur(237.6)).toBe('€237,60')
    expect(formatEur(644)).toBe('€644')
  })
})

describe('when the price is changed by hand in admin (applyInCode: false)', () => {
  it('charges the database price as is, so the discount is never applied twice', async () => {
    vi.resetModules()
    vi.doMock('@/lib/constants/pricing', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/lib/constants/pricing')>()
      return { ...actual, COURSE_PROMO: { ...actual.COURSE_PROMO, enabled: true, applyInCode: false } }
    })
    const promo = await import('./course-promo')
    expect(promo.isCoursePromoActive(START)).toBe(true) // the page still shows the offer
    expect(promo.chargedCoursePrice(950.4, 'full', START)).toBe(950.4)
    vi.doUnmock('@/lib/constants/pricing')
  })
})
