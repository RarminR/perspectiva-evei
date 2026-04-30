import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { validatePromoCode } from '@/services/promo'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ valid: false, error: 'Neautorizat' }, { status: 401 })
  }

  const body = (await req.json()) as {
    code?: string
    amount?: number
    items?: Array<{ productType?: string; productId?: string }>
  }
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  const amount = typeof body.amount === 'number' && Number.isFinite(body.amount) ? body.amount : null

  if (!code) {
    return NextResponse.json({ valid: false, error: 'Codul este obligatoriu.' }, { status: 400 })
  }
  if (amount === null || amount <= 0) {
    return NextResponse.json({ valid: false, error: 'Suma este invalidă.' }, { status: 400 })
  }

  const items = Array.isArray(body.items)
    ? body.items
        .filter(
          (i): i is { productType: string; productId: string } =>
            !!i && typeof i.productType === 'string' && typeof i.productId === 'string'
        )
        .map((i) => ({ productType: i.productType, productId: i.productId }))
    : undefined

  const result = await validatePromoCode(code, amount, items)
  return NextResponse.json(result)
}
