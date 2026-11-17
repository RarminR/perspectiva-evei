import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({ prisma: {} }))

import { geoFromHeaders } from './login-activity'

describe('geoFromHeaders', () => {
  it('reads the approximate location from the hosting headers, without calling a third party', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const geo = geoFromHeaders(
      new Headers({
        'x-vercel-ip-latitude': '44.4268',
        'x-vercel-ip-longitude': '26.1025',
        'x-vercel-ip-city': 'Bucure%C8%99ti',
        'x-vercel-ip-country': 'RO',
      })
    )
    expect(geo).toEqual({ lat: 44.4268, lng: 26.1025, city: 'București', country: 'România' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns null when the location is unknown', () => {
    expect(geoFromHeaders(new Headers())).toBeNull()
  })
})
