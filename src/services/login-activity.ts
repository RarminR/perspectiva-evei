import { prisma } from '@/lib/db'

interface GeoResult {
  lat: number
  lng: number
  city: string
  country: string
}

const MAX_SPEED_KMH = 900

async function geolocateIp(ip: string): Promise<GeoResult | null> {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'unknown' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return null
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city,country`, {
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    if (data.status !== 'success') return null
    return { lat: data.lat, lng: data.lon, city: data.city, country: data.country }
  } catch {
    return null
  }
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

export async function recordLoginActivity(userId: string, ip: string, userAgent?: string): Promise<void> {
  try {
    const geo = await geolocateIp(ip)

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
