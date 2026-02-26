import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next-auth to prevent it from trying to load next/server in test env
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { middlewareCallback } from './middleware'

function createMockAuthRequest(
  pathname: string,
  session: { user?: { role?: string } } | null
) {
  const url = new URL(pathname, 'http://localhost:3000')
  return {
    nextUrl: url,
    auth: session,
    url: url.toString(),
  } as unknown as Parameters<typeof middlewareCallback>[0]
}

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated user from /profilul-meu to /logare', async () => {
    const req = createMockAuthRequest('/profilul-meu', null)
    const response = await middlewareCallback(req)

    expect(response).toBeInstanceOf(Response)
    const location = (response as Response).headers.get('location')
    expect(location).toContain('/logare')
    expect(location).toContain('callbackUrl=/profilul-meu')
  })

  it('redirects unauthenticated user from /curs/test to /logare', async () => {
    const req = createMockAuthRequest('/curs/test', null)
    const response = await middlewareCallback(req)

    expect(response).toBeInstanceOf(Response)
    const location = (response as Response).headers.get('location')
    expect(location).toContain('/logare')
  })

  it('redirects unauthenticated user from /admin/dashboard to /logare', async () => {
    const req = createMockAuthRequest('/admin/dashboard', null)
    const response = await middlewareCallback(req)

    expect(response).toBeInstanceOf(Response)
    const location = (response as Response).headers.get('location')
    expect(location).toContain('/logare')
  })

  it('blocks non-admin from /admin with 403', async () => {
    const req = createMockAuthRequest('/admin/dashboard', {
      user: { role: 'USER' },
    })
    const response = await middlewareCallback(req)

    expect(response).toBeInstanceOf(Response)
    expect((response as Response).status).toBe(403)
    const data = await (response as Response).json()
    expect(data.error).toBe('Acces interzis')
  })

  it('allows admin to access /admin routes', async () => {
    const req = createMockAuthRequest('/admin/dashboard', {
      user: { role: 'ADMIN' },
    })
    const response = await middlewareCallback(req)

    // NextResponse.next() or undefined means allowed
    expect(
      response === undefined ||
        response === null ||
        (response instanceof Response && response.status === 200)
    ).toBe(true)
  })

  it('allows authenticated user to access /profilul-meu', async () => {
    const req = createMockAuthRequest('/profilul-meu', {
      user: { role: 'USER' },
    })
    const response = await middlewareCallback(req)

    expect(
      response === undefined ||
        response === null ||
        (response instanceof Response && response.status === 200)
    ).toBe(true)
  })

  it('allows unauthenticated access to public routes', async () => {
    const req = createMockAuthRequest('/', null)
    const response = await middlewareCallback(req)

    expect(
      response === undefined ||
        response === null ||
        (response instanceof Response && response.status === 200)
    ).toBe(true)
  })
})
