import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createOrder, getOrder, verifyWebhookSignature } from './revolut'

const mockFetch = vi.fn()

vi.stubGlobal('fetch', mockFetch)

describe('Revolut Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.REVOLUT_API_KEY = 'test-api-key'
    process.env.REVOLUT_ENVIRONMENT = 'sandbox'
  })

  describe('createOrder', () => {
    it('sends Revolut-Api-Version header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'order-1', token: 'tok-1', state: 'PENDING' }),
      })

      await createOrder({ amount: 118800, currency: 'EUR' })

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      const headers = options.headers as Record<string, string>
      expect(headers['Revolut-Api-Version']).toBe('2025-12-04')
    })

    it('sends Idempotency-Key header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'order-1', token: 'tok-1', state: 'PENDING' }),
      })

      await createOrder({ amount: 118800, currency: 'EUR' })

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      const headers = options.headers as Record<string, string>

      expect(headers['Idempotency-Key']).toBeDefined()
      expect(headers['Idempotency-Key']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('includes expire_pending_after in body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'order-1', token: 'tok-1', state: 'PENDING' }),
      })

      await createOrder({ amount: 118800, currency: 'EUR', expirePendingAfter: 'P7D' })

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(options.body as string)
      expect(body.expire_pending_after).toBe('P7D')
    })

    it('defaults expire_pending_after to PT24H', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'order-1', token: 'tok-1', state: 'PENDING' }),
      })

      await createOrder({ amount: 118800, currency: 'EUR' })

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(options.body as string)
      expect(body.expire_pending_after).toBe('PT24H')
    })

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      })

      await expect(createOrder({ amount: 118800, currency: 'EUR' })).rejects.toThrow(
        'Revolut createOrder failed: 401'
      )
    })
  })

  describe('getOrder', () => {
    it('fetches order with API version header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'order-1', token: 'tok-1', state: 'PENDING' }),
      })

      await getOrder('order-1')

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      const headers = options.headers as Record<string, string>
      expect(headers['Revolut-Api-Version']).toBe('2025-12-04')
    })
  })

  describe('verifyWebhookSignature', () => {
    it('returns true for valid signature', async () => {
      const secret = 'test-secret'
      const body = '{"event":"ORDER_COMPLETED","order_id":"ord-1"}'
      const timestamp = '1234567890'

      const crypto = await import('crypto')
      const payload = `v1.${timestamp}.${body}`
      const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')

      const header = `v1=${sig},ts=${timestamp}`
      expect(verifyWebhookSignature(body, header, secret)).toBe(true)
    })

    it('returns false for tampered body', async () => {
      const secret = 'test-secret'
      const body = '{"event":"ORDER_COMPLETED","order_id":"ord-1"}'
      const tamperedBody = '{"event":"ORDER_COMPLETED","order_id":"ord-HACKED"}'
      const timestamp = '1234567890'

      const crypto = await import('crypto')
      const payload = `v1.${timestamp}.${body}`
      const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')

      const header = `v1=${sig},ts=${timestamp}`
      expect(verifyWebhookSignature(tamperedBody, header, secret)).toBe(false)
    })

    it('returns false for missing signature parts', () => {
      expect(verifyWebhookSignature('body', 'invalid-header', 'secret')).toBe(false)
    })
  })
})
