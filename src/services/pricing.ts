import { prisma } from '@/lib/db'
import { SESSION_PRICING } from '@/lib/constants/pricing'
import { chargedCoursePrice, type CoursePaymentType } from '@/lib/course-promo'

export type CheckoutProductType = 'COURSE' | 'GUIDE' | 'BUNDLE' | 'SESSION' | 'PRODUCT'

export interface ResolvedCheckoutItem {
  productId: string
  productType: CheckoutProductType
  name: string
  priceEur: number
  priceEurCents: number
  paymentType?: CoursePaymentType
}

/** A checkout item that can't be priced; `status` is the HTTP status to answer with. */
export class PricingError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'PricingError'
  }
}

function toCents(priceEur: number): number {
  return Math.round(priceEur * 100)
}

/**
 * The single source of truth for what an item costs. Both the checkout page
 * (through /api/checkout/resolve) and order creation use it, so the amount sent to
 * Revolut never comes from the browser.
 */
export async function resolveCheckoutItem(
  productType: string,
  productId: string | null | undefined,
  paymentType: CoursePaymentType = 'full',
  now: Date = new Date()
): Promise<ResolvedCheckoutItem> {
  switch (productType) {
    case 'COURSE': {
      const edition = await prisma.courseEdition.findFirst({
        where: { enrollmentOpen: true },
        include: { course: true },
        orderBy: { editionNumber: 'desc' },
      })
      if (!edition) {
        throw new PricingError('Nicio ediție activă', 404)
      }
      // At order time the browser sends back the edition it was shown; refuse a stale one.
      if (productId && productId !== edition.id) {
        throw new PricingError('Ediția nu mai este disponibilă. Reîncarcă pagina.', 409)
      }
      const basePrice =
        paymentType === 'installment'
          ? (edition.course.installmentPrice ?? edition.course.price)
          : edition.course.price
      const priceEur = chargedCoursePrice(basePrice, paymentType, now)
      return {
        productId: edition.id,
        productType: 'COURSE',
        name: `${edition.course.title} — Ediția ${edition.editionNumber}`,
        priceEur,
        priceEurCents: toCents(priceEur),
        paymentType,
      }
    }

    case 'GUIDE': {
      if (!productId) {
        throw new PricingError('id lipsă pentru ghid', 400)
      }
      const guide = await prisma.guide.findUnique({ where: { id: productId } })
      if (!guide) {
        throw new PricingError('Ghidul nu a fost găsit', 404)
      }
      return {
        productId: guide.id,
        productType: 'GUIDE',
        name: guide.title,
        priceEur: guide.price,
        priceEurCents: toCents(guide.price),
      }
    }

    case 'BUNDLE': {
      if (!productId) {
        throw new PricingError('id lipsă pentru bundle', 400)
      }
      const bundle = await prisma.bundle.findUnique({ where: { id: productId } })
      if (!bundle) {
        throw new PricingError('Bundle-ul nu a fost găsit', 404)
      }
      return {
        productId: bundle.id,
        productType: 'BUNDLE',
        name: bundle.title,
        priceEur: bundle.price,
        priceEurCents: toCents(bundle.price),
      }
    }

    case 'SESSION': {
      if (!productId) {
        throw new PricingError('Slot invalid pentru ședință.', 400)
      }
      const scheduledAt = new Date(productId)
      if (Number.isNaN(scheduledAt.getTime())) {
        throw new PricingError('Data slotului invalidă.', 400)
      }
      if (scheduledAt.getTime() < now.getTime()) {
        throw new PricingError('Slotul ales e în trecut.', 400)
      }
      const conflict = await prisma.session1on1.findFirst({
        where: { scheduledAt, status: 'BOOKED' },
      })
      if (conflict) {
        throw new PricingError('Slotul ales tocmai a fost rezervat.', 409)
      }
      const formatted = scheduledAt.toLocaleString('ro-RO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      return {
        productId: scheduledAt.toISOString(),
        productType: 'SESSION',
        name: `${SESSION_PRICING.PRODUCT_NAME} — ${formatted}`,
        priceEur: SESSION_PRICING.PRICE_EUR,
        priceEurCents: toCents(SESSION_PRICING.PRICE_EUR),
      }
    }

    case 'PRODUCT': {
      if (!productId) {
        throw new PricingError('id lipsă pentru produs', 400)
      }
      const product = await prisma.product.findUnique({ where: { id: productId } })
      if (!product || !product.active) {
        throw new PricingError('Produsul nu a fost găsit', 404)
      }
      return {
        productId: product.id,
        productType: 'PRODUCT',
        name: product.title,
        priceEur: product.price,
        priceEurCents: toCents(product.price),
      }
    }

    default:
      throw new PricingError('Tip de produs necunoscut', 400)
  }
}
