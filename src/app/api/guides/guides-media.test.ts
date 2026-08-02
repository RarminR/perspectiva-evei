import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

const mockGuideFindUnique = vi.fn()
const mockGuideAccessFindUnique = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    guide: {
      findUnique: (...args: any[]) => mockGuideFindUnique(...args),
    },
    guideAccess: {
      findUnique: (...args: any[]) => mockGuideAccessFindUnique(...args),
    },
  },
}))

const SIGNED_URL = 'https://cdn.test.b-cdn.net/guides/audio/carte.mp3?token=abc&expires=123'
const mockGetSignedCdnUrl = vi.fn((..._args: any[]) => SIGNED_URL)
vi.mock('@/services/bunny', () => ({
  getSignedCdnUrl: (...args: any[]) => mockGetSignedCdnUrl(...args),
}))

function userSession() {
  return { user: { id: 'u1', role: 'USER' } }
}

describe('GET /api/guides/[id]/audio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(userSession())
  })

  it('redirects to the signed CDN URL instead of proxying the file', async () => {
    mockGuideFindUnique.mockResolvedValue({ audioKey: 'guides/audio/carte.mp3' })
    mockGuideAccessFindUnique.mockResolvedValue({ id: 'ga1' })

    const { GET } = await import('@/app/api/guides/[id]/audio/route')
    const res = await GET(new Request('http://localhost/api/guides/g1/audio'), {
      params: Promise.resolve({ id: 'g1' }),
    })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(SIGNED_URL)
    expect(res.headers.get('cache-control')).toBe('private, no-store')
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const { GET } = await import('@/app/api/guides/[id]/audio/route')
    const res = await GET(new Request('http://localhost/api/guides/g1/audio'), {
      params: Promise.resolve({ id: 'g1' }),
    })

    expect(res.status).toBe(401)
  })

  it('returns 403 without guide access', async () => {
    mockGuideFindUnique.mockResolvedValue({ audioKey: 'guides/audio/carte.mp3' })
    mockGuideAccessFindUnique.mockResolvedValue(null)

    const { GET } = await import('@/app/api/guides/[id]/audio/route')
    const res = await GET(new Request('http://localhost/api/guides/g1/audio'), {
      params: Promise.resolve({ id: 'g1' }),
    })

    expect(res.status).toBe(403)
  })

  it('returns 404 when the guide has no audio', async () => {
    mockGuideFindUnique.mockResolvedValue({ audioKey: null })

    const { GET } = await import('@/app/api/guides/[id]/audio/route')
    const res = await GET(new Request('http://localhost/api/guides/g1/audio'), {
      params: Promise.resolve({ id: 'g1' }),
    })

    expect(res.status).toBe(404)
  })
})

describe('GET /api/guides/[id]/pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(userSession())
  })

  function makeReq(url: string) {
    const req = new Request(url) as any
    req.nextUrl = new URL(url)
    return req
  }

  it('redirects to the signed CDN URL by default', async () => {
    mockGuideFindUnique.mockResolvedValue({ pdfKey: 'guides/pdf/ghid.pdf' })
    mockGuideAccessFindUnique.mockResolvedValue({ id: 'ga1' })

    const { GET } = await import('@/app/api/guides/[id]/pdf/route')
    const res = await GET(makeReq('http://localhost/api/guides/g1/pdf'), {
      params: Promise.resolve({ id: 'g1' }),
    })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(SIGNED_URL)
    expect(res.headers.get('cache-control')).toBe('private, no-store')
  })

  it('streams the file in proxy mode as a fallback', async () => {
    mockGuideFindUnique.mockResolvedValue({ pdfKey: 'guides/pdf/ghid.pdf' })
    mockGuideAccessFindUnique.mockResolvedValue({ id: 'ga1' })

    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response('PDFDATA', {
          status: 200,
          headers: { 'content-type': 'application/pdf', 'content-length': '7' },
        })
      )

    const { GET } = await import('@/app/api/guides/[id]/pdf/route')
    const res = await GET(makeReq('http://localhost/api/guides/g1/pdf?mode=proxy'), {
      params: Promise.resolve({ id: 'g1' }),
    })

    expect(fetchSpy).toHaveBeenCalledWith(SIGNED_URL)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/pdf')
    expect(await res.text()).toBe('PDFDATA')

    fetchSpy.mockRestore()
  })

  it('returns 403 without guide access', async () => {
    mockGuideFindUnique.mockResolvedValue({ pdfKey: 'guides/pdf/ghid.pdf' })
    mockGuideAccessFindUnique.mockResolvedValue(null)

    const { GET } = await import('@/app/api/guides/[id]/pdf/route')
    const res = await GET(makeReq('http://localhost/api/guides/g1/pdf'), {
      params: Promise.resolve({ id: 'g1' }),
    })

    expect(res.status).toBe(403)
  })
})
