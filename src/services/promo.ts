import { prisma } from '@/lib/db'

export interface PromoValidationResult {
  valid: boolean
  error?: string
  discountType?: 'PERCENTAGE' | 'FIXED'
  discountValue?: number
  finalAmount?: number
}

export async function validatePromoCode(
  code: string,
  amount: number
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
