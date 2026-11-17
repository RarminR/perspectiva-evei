import { COURSE_PROMO } from '@/lib/constants/pricing'

export type CoursePaymentType = 'full' | 'installment'

/** True while the course promotion window is open (start inclusive, end exclusive). */
export function isCoursePromoActive(now: Date = new Date()): boolean {
  if (!COURSE_PROMO.enabled) return false
  const t = now.getTime()
  return t >= Date.parse(COURSE_PROMO.startsAt) && t < Date.parse(COURSE_PROMO.endsAt)
}

/** Applies the promotion percentage to a price in EUR, rounded to the cent. */
export function applyCoursePromo(basePriceEur: number): number {
  const cents = Math.round(basePriceEur * 100)
  return Math.round((cents * (100 - COURSE_PROMO.percentOff)) / 100) / 100
}

/**
 * The course price checkout charges. The promotion applies only to full payment,
 * only inside the window, and only when the discount is applied in code
 * (COURSE_PROMO.applyInCode). Otherwise the price from the database is returned as is.
 */
export function chargedCoursePrice(
  basePriceEur: number,
  paymentType: CoursePaymentType,
  now: Date = new Date()
): number {
  if (paymentType !== 'full' || !COURSE_PROMO.applyInCode || !isCoursePromoActive(now)) {
    return basePriceEur
  }
  return applyCoursePromo(basePriceEur)
}

/** Romanian display format used on the site: €1.188, €950,40. */
export function formatEur(amountEur: number): string {
  const cents = Math.round(amountEur * 100)
  const whole = Math.floor(cents / 100)
  const rest = cents % 100
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return rest === 0 ? `€${wholeStr}` : `€${wholeStr},${rest.toString().padStart(2, '0')}`
}
