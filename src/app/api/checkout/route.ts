import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { createCheckout } from '@/services/checkout'
import type { CheckoutItem } from '@/services/checkout'

const PRODUCT_TYPES = new Set(['COURSE', 'GUIDE', 'BUNDLE', 'SESSION', 'PRODUCT'])

function isCheckoutItem(value: unknown): value is CheckoutItem {
  if (!value || typeof value !== 'object') {
    return false
  }

  const item = value as Record<string, unknown>
  return (
    typeof item.productId === 'string' &&
    typeof item.productType === 'string' &&
    PRODUCT_TYPES.has(item.productType) &&
    typeof item.name === 'string' &&
    typeof item.priceEurCents === 'number' &&
    Number.isFinite(item.priceEurCents) &&
    item.priceEurCents > 0 &&
    typeof item.quantity === 'number' &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const body = (await req.json()) as { items?: unknown[]; promoCode?: string }
  if (!body.items || body.items.length === 0) {
    return NextResponse.json({ error: 'Coșul este gol' }, { status: 400 })
  }

  const items = body.items.filter(isCheckoutItem)
  if (items.length === 0) {
    return NextResponse.json({ error: 'Date checkout invalide' }, { status: 400 })
  }

  try {
    const result = await createCheckout((session.user as { id: string }).id, items, body.promoCode)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
