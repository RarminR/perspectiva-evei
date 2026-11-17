import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }),
}))
vi.mock('@/services/checkout', () => ({
  createCheckout: vi.fn().mockResolvedValue({ orderId: 'o1', revolutOrderId: 'r1', checkoutToken: 't', checkoutUrl: 'u' }),
}))

import { createCheckout } from '@/services/checkout'
import { POST } from './route'

const BILLING = {
  firstName: 'Maria',
  lastName: 'Ionescu',
  email: 'maria@example.com',
  phone: '0700000000',
  county: 'Prahova',
  city: 'Ploiești',
  address: 'Str. Test 1',
  postalCode: '100000',
}

function request(body: unknown) {
  return new Request('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const GUIDE_ITEM = { productId: 'g1', productType: 'GUIDE', name: 'Ghid', priceEurCents: 2750, quantity: 1 }
const COURSE_ITEM = { productId: 'e15', productType: 'COURSE', name: 'Curs', priceEurCents: 118800, quantity: 1 }

describe('POST /api/checkout: immediate access to guides', () => {
  beforeEach(() => vi.mocked(createCheckout).mockClear())

  it('refuses a guide without the immediate-access consent', async () => {
    const res = await POST(request({ items: [GUIDE_ITEM], billing: BILLING }) as never)
    expect(res.status).toBe(400)
    expect(createCheckout).not.toHaveBeenCalled()
  })

  it('records the time of the consent with the billing data', async () => {
    const res = await POST(
      request({ items: [GUIDE_ITEM], billing: BILLING, digitalContentConsent: true }) as never
    )
    expect(res.status).toBe(201)
    const billing = vi.mocked(createCheckout).mock.calls[0][3]
    expect(billing?.digitalContentConsentAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('does not ask for it on the course', async () => {
    const res = await POST(request({ items: [COURSE_ITEM], billing: BILLING }) as never)
    expect(res.status).toBe(201)
    const billing = vi.mocked(createCheckout).mock.calls[0][3]
    expect(billing?.digitalContentConsentAt).toBeUndefined()
  })
})
