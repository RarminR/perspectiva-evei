import { prisma } from '@/lib/db'

interface GeoResult {
  lat: number
  lng: number
  city: string
  country: string
}

const MAX_SPEED_KMH = 900

/**
 * Approximate location from the hosting provider's request headers (Vercel adds them to every
 * request). No IP address is sent to a third-party geolocation service.
 */
export function geoFromHeaders(headers: Headers): GeoResult | null {
  const lat = Number(headers.get('x-vercel-ip-latitude'))
  const lng = Number(headers.get('x-vercel-ip-longitude'))
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null

  let city = ''
  try {
    city = decodeURIComponent(headers.get('x-vercel-ip-city') ?? '')
  } catch {
    city = headers.get('x-vercel-ip-city') ?? ''
  }

  const code = headers.get('x-vercel-ip-country') ?? ''
  let country = code
  try {
    country = code ? (new Intl.DisplayNames(['ro'], { type: 'region' }).of(code) ?? code) : ''
  } catch {
    country = code
  }

  return { lat, lng, city, country }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function checkSuspicious(
  prevLogin: { lat: number; lng: number; createdAt: Date },
  currentGeo: GeoResult,
  now: Date
): { flagged: boolean; reason: string | null } {
  const distKm = haversineKm(prevLogin.lat, prevLogin.lng, currentGeo.lat, currentGeo.lng)

  if (distKm < 50) {
    return { flagged: false, reason: null }
  }

  const hoursDiff = (now.getTime() - prevLogin.createdAt.getTime()) / (1000 * 60 * 60)
  if (hoursDiff < 0.01) {
    return { flagged: true, reason: `${Math.round(distKm)}km distanță, login simultan` }
  }

  const speedKmh = distKm / hoursDiff
  if (speedKmh > MAX_SPEED_KMH) {
    return {
      flagged: true,
      reason: `${Math.round(distKm)}km în ${hoursDiff < 1 ? Math.round(hoursDiff * 60) + 'min' : Math.round(hoursDiff) + 'h'} (${Math.round(speedKmh)} km/h)`,
    }
  }

  return { flagged: false, reason: null }
}

export async function recordLoginActivity(
  userId: string,
  ip: string,
  userAgent?: string,
  geo: GeoResult | null = null
): Promise<void> {
  try {

    let flagged = false
    let flagReason: string | null = null

    if (geo) {
      const prevLogin = await prisma.loginActivity.findFirst({
        where: { userId, lat: { not: null }, lng: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { lat: true, lng: true, createdAt: true },
      })

      if (prevLogin?.lat != null && prevLogin?.lng != null) {
        const result = checkSuspicious(
          { lat: prevLogin.lat, lng: prevLogin.lng, createdAt: prevLogin.createdAt },
          geo,
          new Date()
        )
        flagged = result.flagged
        flagReason = result.reason
      }
    }

    await prisma.loginActivity.create({
      data: {
        userId,
        ip,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        city: geo?.city ?? null,
        country: geo?.country ?? null,
        userAgent: userAgent?.slice(0, 500) ?? null,
        flagged,
        flagReason,
      },
    })
  } catch (err) {
    console.error('Failed to record login activity:', err)
  }
}
