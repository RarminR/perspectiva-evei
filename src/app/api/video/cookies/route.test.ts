import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/services/course', () => ({
  checkAccess: vi.fn(),
}))

vi.mock('@/services/device', () => ({
  validateDevice: vi.fn(),
}))

vi.mock('@/services/aws-video', () => ({
  generateSignedCookies: vi.fn(),
  refreshSignedCookies: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { checkAccess } from '@/services/course'
import { validateDevice } from '@/services/device'
import { generateSignedCookies } from '@/services/aws-video'
import { GET } from './route'

function createRequest(fingerprint?: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/video/cookies?editionId=edition-1', {
    method: 'GET',
    headers: fingerprint ? { 'x-device-fingerprint': fingerprint } : undefined,
  })
}

describe('GET /api/video/cookies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const response = await GET(createRequest('fp-1'))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Neautorizat')
  })

  it('returns 403 when user has no course access', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)
    vi.mocked(validateDevice).mockResolvedValue(true)
    vi.mocked(checkAccess).mockResolvedValue(false)

    const response = await GET(createRequest('fp-1'))
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Nu ai acces la acest curs.')
  })

  it('returns 403 when device is not registered', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)
    vi.mocked(validateDevice).mockResolvedValue(false)

    const response = await GET(createRequest('fp-unknown'))
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Dispozitiv neautorizat')
  })

  it('returns 200 with CloudFront Set-Cookie values when access is valid', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)
    vi.mocked(validateDevice).mockResolvedValue(true)
    vi.mocked(checkAccess).mockResolvedValue(true)
    vi.mocked(generateSignedCookies).mockResolvedValue({
      cookies: {
        'CloudFront-Policy': 'policy-value',
        'CloudFront-Signature': 'signature-value',
        'CloudFront-Key-Pair-Id': 'key-pair-value',
      },
      cookieOptions: {
        domain: '.perspectivaevei.com',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'none',
        maxAge: 7200,
      },
    })

    const response = await GET(createRequest('fp-1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(response.cookies.get('CloudFront-Policy')?.value).toBe('policy-value')
    expect(response.cookies.get('CloudFront-Signature')?.value).toBe('signature-value')
    expect(response.cookies.get('CloudFront-Key-Pair-Id')?.value).toBe('key-pair-value')
  })
})
