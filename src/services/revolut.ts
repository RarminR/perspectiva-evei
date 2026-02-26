import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

import type { CreateOrderParams, RefundParams, RevolutEnvironment, RevolutOrder } from '@/types/revolut'

const REVOLUT_API_VERSION = '2025-12-04'

function getBaseUrl(env: RevolutEnvironment = 'sandbox'): string {
  return env === 'production'
    ? 'https://merchant.revolut.com/api/1.0'
    : 'https://sandbox-merchant.revolut.com/api/1.0'
}

function getEnvironment(): RevolutEnvironment {
  return (process.env.REVOLUT_ENVIRONMENT as RevolutEnvironment) || 'sandbox'
}

async function revolutFetch(
  path: string,
  options: RequestInit = {},
  idempotencyKey?: string
): Promise<Response> {
  const env = getEnvironment()
  const url = `${getBaseUrl(env)}${path}`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.REVOLUT_API_KEY}`,
    'Content-Type': 'application/json',
    'Revolut-Api-Version': REVOLUT_API_VERSION,
    ...((options.headers as Record<string, string>) || {}),
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  return fetch(url, { ...options, headers })
}

export async function createOrder(params: CreateOrderParams): Promise<RevolutOrder> {
  const idempotencyKey = uuidv4()

  const body = {
    amount: params.amount,
    currency: params.currency,
    customer: params.customerEmail
      ? {
          email: params.customerEmail,
          name: params.customerName,
        }
      : undefined,
    description: params.description,
    redirect_url: params.redirectUrl,
    merchant_order_data: params.merchantOrderReference
      ? {
          reference: params.merchantOrderReference,
        }
      : undefined,
    expire_pending_after: params.expirePendingAfter || 'PT24H',
  }

  const response = await revolutFetch(
    '/orders',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    idempotencyKey
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Revolut createOrder failed: ${response.status} ${error}`)
  }

  return response.json()
}

export async function getOrder(orderId: string): Promise<RevolutOrder> {
  const response = await revolutFetch(`/orders/${orderId}`)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Revolut getOrder failed: ${response.status} ${error}`)
  }

  return response.json()
}

export async function refundOrder(orderId: string, params: RefundParams = {}): Promise<void> {
  const idempotencyKey = uuidv4()

  const response = await revolutFetch(
    `/orders/${orderId}/refund`,
    {
      method: 'POST',
      body: JSON.stringify({
        amount: params.amount,
        description: params.description,
      }),
    },
    idempotencyKey
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Revolut refundOrder failed: ${response.status} ${error}`)
  }
}

export async function cancelOrder(orderId: string): Promise<void> {
  const idempotencyKey = uuidv4()

  const response = await revolutFetch(`/orders/${orderId}/cancel`, { method: 'POST' }, idempotencyKey)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Revolut cancelOrder failed: ${response.status} ${error}`)
  }
}

export function verifyWebhookSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  try {
    const parts = signatureHeader.split(',')
    const sigPart = parts.find((part) => part.startsWith('v1='))
    const tsPart = parts.find((part) => part.startsWith('ts='))

    if (!sigPart || !tsPart) {
      return false
    }

    const signature = sigPart.replace('v1=', '')
    const timestamp = tsPart.replace('ts=', '')
    const payload = `v1.${timestamp}.${rawBody}`

    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex')

    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))
  } catch {
    return false
  }
}
