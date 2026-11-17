import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSend = vi.fn()
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}))
vi.mock('@/lib/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

function request(body: unknown) {
  return new Request('http://localhost/api/retragere', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID = {
  name: 'Maria Ionescu',
  email: 'maria@example.com',
  contract: 'Cursul A.D.O.! – Ediția 15',
}

describe('POST /api/retragere (withdrawal function)', () => {
  beforeEach(() => {
    mockSend.mockReset()
    mockSend.mockResolvedValue({ data: { id: 'e1' }, error: null })
  })

  it('sends the statement to the trader and the acknowledgment, with date and time, to the consumer', async () => {
    const { POST } = await import('./route')
    const res = await POST(request(VALID) as never)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.ackSent).toBe(true)
    expect(mockSend).toHaveBeenCalledTimes(2)

    const [toTrader] = mockSend.mock.calls[0]
    expect(toTrader.to).toBe('estedespremine@gmail.com')
    expect(toTrader.replyTo).toBe('maria@example.com')
    expect(toTrader.text).toContain('Cursul A.D.O.! – Ediția 15')

    const [ack] = mockSend.mock.calls[1]
    expect(ack.to).toBe('maria@example.com')
    expect(ack.text).toContain('Primită pe')
    expect(ack.text).toContain(data.when)
  })

  it('refuses a statement without name, valid e-mail or contract', async () => {
    const { POST } = await import('./route')
    for (const body of [
      { ...VALID, name: '' },
      { ...VALID, email: 'not-an-email' },
      { ...VALID, contract: '   ' },
    ]) {
      const res = await POST(request(body) as never)
      expect(res.status).toBe(400)
    }
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('reports an error when the statement cannot reach the trader', async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { message: 'down' } })
    const { POST } = await import('./route')
    const res = await POST(request(VALID) as never)
    expect(res.status).toBe(502)
    expect(mockSend).toHaveBeenCalledTimes(1)
  })
})
