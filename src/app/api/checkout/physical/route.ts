import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createOrder } from '@/services/revolut'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { productId, quantity, shippingAddress } = await req.json()

  // Validate required fields
  if (
    !productId ||
    !quantity ||
    !shippingAddress?.judet ||
    !shippingAddress?.localitate ||
    !shippingAddress?.strada ||
    !shippingAddress?.codPostal
  ) {
    return NextResponse.json({ error: 'Câmpuri obligatorii lipsă' }, { status: 400 })
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || !product.active) {
    return NextResponse.json({ error: 'Produsul nu este disponibil' }, { status: 404 })
  }

  if (product.stock < quantity) {
    return NextResponse.json({ error: 'Stoc insuficient' }, { status: 400 })
  }

  const totalAmount = product.price * quantity
  const totalCents = Math.round(totalAmount * 100)

  // Create Revolut order
  const revolutOrder = await createOrder({
    amount: totalCents,
    currency: 'EUR',
    description: `${product.title} x${quantity}`,
    merchantOrderReference: `physical-${userId}-${Date.now()}`,
  })

  // Create DB order with shipping address
  const order = await prisma.order.create({
    data: {
      userId,
      revolutOrderId: revolutOrder.id,
      revolutCheckoutUrl: revolutOrder.checkout_url,
      status: 'PENDING',
      totalAmount,
      currency: 'EUR',
      shippingAddress,
      items: {
        create: [
          {
            productId,
            productType: 'PRODUCT',
            quantity,
            unitPrice: product.price,
          },
        ],
      },
    },
  })

  return NextResponse.json({
    checkoutUrl: revolutOrder.checkout_url,
    orderId: order.id,
  })
}
