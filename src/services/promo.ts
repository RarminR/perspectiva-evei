import { prisma } from '@/lib/db'

export interface PromoValidationResult {
  valid: boolean
  error?: string
  discountType?: 'PERCENTAGE' | 'FIXED'
  discountValue?: number
  finalAmount?: number
}

export interface PromoItemRef {
  productType: string
  productId: string
}

function parseAppliesTo(value: unknown): { type: string; id: string }[] | null {
  if (!Array.isArray(value)) return null
  const cleaned = value.filter(
    (entry): entry is { type: string; id: string } =>
      !!entry &&
      typeof entry === 'object' &&
      typeof (entry as any).type === 'string' &&
      typeof (entry as any).id === 'string'
  )
  return cleaned.length > 0 ? cleaned : null
}

export async function validatePromoCode(
  code: string,
  amount: number,
  items?: PromoItemRef[]
): Promise<PromoValidationResult> {
  const promo = await prisma.promoCode.findUnique({ where: { code } })

  if (!promo) {
    return { valid: false, error: 'Codul promoțional nu există.' }
  }

  if (!promo.active) {
    return { valid: false, error: 'Codul promoțional nu este activ.' }
  }

  const now = new Date()

  if (promo.validFrom && promo.validFrom > now) {
    return { valid: false, error: 'Codul promoțional nu este încă activ.' }
  }

  if (promo.validUntil && promo.validUntil < now) {
    return { valid: false, error: 'Codul promoțional a expirat.' }
  }

  if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
    return { valid: false, error: 'Codul a fost folosit de numărul maxim de ori.' }
  }

  const appliesTo = parseAppliesTo((promo as { appliesTo?: unknown }).appliesTo ?? null)
  if (appliesTo && appliesTo.length > 0) {
    if (!items || items.length === 0) {
      return { valid: false, error: 'Codul nu se aplică acestui produs.' }
    }
    const matches = items.some((item) =>
      appliesTo.some((scope) => scope.type === item.productType && scope.id === item.productId)
    )
    if (!matches) {
      return { valid: false, error: 'Codul nu se aplică produselor din coș.' }
    }
  }

  const finalAmount = applyDiscount(amount, promo.type as 'PERCENTAGE' | 'FIXED', promo.value)

  return {
    valid: true,
    discountType: promo.type as 'PERCENTAGE' | 'FIXED',
    discountValue: promo.value,
    finalAmount,
  }
}

function applyDiscount(
  amount: number,
  type: 'PERCENTAGE' | 'FIXED',
  value: number
): number {
  if (type === 'PERCENTAGE') {
    return Math.round((amount * (1 - value / 100)) * 100) / 100
  }
  return Math.max(0, amount - value)
}

export function applyPromoCode(
  amount: number,
  discountType: 'PERCENTAGE' | 'FIXED',
  discountValue: number
): number {
  return applyDiscount(amount, discountType, discountValue)
}

export async function incrementPromoUse(code: string): Promise<void> {
  await prisma.promoCode.update({
    where: { code },
    data: { currentUses: { increment: 1 } },
  })
}
