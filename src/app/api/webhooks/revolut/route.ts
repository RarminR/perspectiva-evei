import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { fulfillOrder } from '@/services/order-fulfillment'
import { verifyWebhookSignature } from '@/services/revolut'

type RevolutWebhookEvent = {
  event?: string
  order_id?: string
}

async function processWebhookEvent(event: RevolutWebhookEvent): Promise<void> {
  const eventType = event.event
  const revolutOrderId = event.order_id

  if (!eventType || !revolutOrderId) {
    return
  }

  try {
    if (eventType === 'ORDER_COMPLETED') {
      const order = await prisma.order.findFirst({ where: { revolutOrderId } })
      if (order) {
        await fulfillOrder(order.id)
      }
      return
    }

    if (eventType === 'ORDER_FAILED' || eventType === 'ORDER_CANCELLED') {
      await prisma.order.updateMany({
        where: { revolutOrderId },
        data: { status: eventType === 'ORDER_FAILED' ? 'FAILED' : 'CANCELLED' },
      })
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
  }
}

const WEBHOOK_TOLERANCE_SECONDS = 300 // 5 minutes

function extractTimestamp(signatureHeader: string, timestampHeader: string | null): number | null {
  const tsPart = signatureHeader.split(',').find((p) => p.startsWith('ts='))
  if (tsPart) return Number(tsPart.replace('ts=', ''))
  if (timestampHeader) return Number(timestampHeader)
  return null
}

export async function POST(req: Request) {
  const rawBody = await req.text()

  const signatureHeader = req.headers.get('revolut-signature') ?? ''
  const timestampHeader = req.headers.get('revolut-request-timestamp')
  const normalizedSignature =
    signatureHeader.includes('ts=') || !timestampHeader
      ? signatureHeader
      : `${signatureHeader},ts=${timestampHeader}`

  const secret = process.env.REVOLUT_WEBHOOK_SECRET || ''
  const isValid = verifyWebhookSignature(rawBody, normalizedSignature, secret)

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const ts = extractTimestamp(signatureHeader, timestampHeader)
  if (ts !== null) {
    const ageSeconds = Math.floor(Date.now() / 1000) - ts
    if (ageSeconds > WEBHOOK_TOLERANCE_SECONDS || ageSeconds < -60) {
      return NextResponse.json({ error: 'Request timestamp out of tolerance' }, { status: 401 })
    }
  }

  const event = JSON.parse(rawBody) as RevolutWebhookEvent
  await processWebhookEvent(event)

  return NextResponse.json({ received: true })
}
