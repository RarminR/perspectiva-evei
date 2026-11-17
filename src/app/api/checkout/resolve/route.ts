import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PricingError, resolveCheckoutItem } from '@/services/pricing'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const productType = searchParams.get('productType')
  const paymentType = searchParams.get('paymentType') === 'installment' ? 'installment' : 'full'

  if (!productType) {
    return NextResponse.json({ error: 'productType lipsă' }, { status: 400 })
  }

  // COURSE always resolves to the edition with open enrollment; SESSION is keyed by its slot.
  const productId =
    productType === 'COURSE'
      ? null
      : productType === 'SESSION'
        ? searchParams.get('scheduledAt')
        : searchParams.get('id')

  try {
    const item = await resolveCheckoutItem(productType, productId, paymentType)
    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Eroare la rezolvarea produsului' }, { status: 500 })
  }
}
