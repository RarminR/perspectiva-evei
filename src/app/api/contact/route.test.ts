import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Resend
const mockSend = vi.fn()
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}))

describe('POST /api/contact', () => {
  beforeEach(() => {
    mockSend.mockReset()
    mockSend.mockResolvedValue({ id: 'test-email-id' })
  })

  it('returns 200 on valid submission', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Maria',
        email: 'maria@example.com',
        message: 'Vreau mai multe informații',
      }),
    })

    const res = await POST(req as never)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockSend).toHaveBeenCalledOnce()
  })

  it('returns 400 when name is missing', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'maria@example.com',
        message: 'Test',
      }),
    })

    const res = await POST(req as never)
    expect(res.status).toBe(400)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('returns 400 when email is missing', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Maria',
        message: 'Test',
      }),
    })

    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when message is missing', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Maria',
        email: 'maria@example.com',
      }),
    })

    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('sends email to correct address', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Maria',
        email: 'maria@example.com',
        message: 'Vreau informații',
      }),
    })

    await POST(req as never)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'estedespremine@gmail.com',
        subject: expect.stringContaining('Maria'),
      })
    )
  })
})
