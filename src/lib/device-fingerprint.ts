export interface FingerprintData {
  userAgent: string
  screenResolution: string
  timezone: string
  language: string
  platform: string
  colorDepth: string
  hardwareConcurrency: string
}

export function collectFingerprint(): FingerprintData {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      screenResolution: '',
      timezone: '',
      language: '',
      platform: '',
      colorDepth: '',
      hardwareConcurrency: '',
    }
  }

  const platform = (navigator as any).platform || ''

  return {
    userAgent: navigator.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform,
    colorDepth: String(screen.colorDepth),
    hardwareConcurrency: String(navigator.hardwareConcurrency || 0),
  }
}

export async function generateFingerprintHash(data: FingerprintData): Promise<string> {
  const str = JSON.stringify(data)

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(str)
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }

  return Math.abs(hash).toString(16)
}

export async function getDeviceFingerprint(): Promise<string> {
  const data = collectFingerprint()
  return generateFingerprintHash(data)
}

const STORAGE_KEY = 'device-fingerprint'

function getDeviceName(): string {
  const ua = navigator.userAgent
  let browser = 'Browser'
  if (/edg/i.test(ua)) browser = 'Edge'
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome'
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox'
  else if (/safari/i.test(ua)) browser = 'Safari'

  let device = 'Desktop'
  if (/iphone/i.test(ua)) device = 'iPhone'
  else if (/ipad/i.test(ua)) device = 'iPad'
  else if (/android/i.test(ua)) device = 'Android'
  else if (/macintosh/i.test(ua)) device = 'Mac'
  else if (/windows/i.test(ua)) device = 'Windows'

  return `${browser} pe ${device}`
}

let registrationPromise: Promise<{ fingerprint: string; error?: string }> | null = null

/**
 * Returns the device fingerprint (generating and persisting it on first use)
 * and registers the device with the server so video routes can validate it.
 * Deduped per page load — concurrent callers share one registration request.
 */
export function ensureDeviceRegistered(): Promise<{ fingerprint: string; error?: string }> {
  if (!registrationPromise) {
    registrationPromise = (async () => {
      let fingerprint = localStorage.getItem(STORAGE_KEY)
      if (!fingerprint) {
        fingerprint = await getDeviceFingerprint()
        localStorage.setItem(STORAGE_KEY, fingerprint)
      }

      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint, deviceName: getDeviceName() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // Allow a later retry (e.g. after the user removes an old device)
        registrationPromise = null
        return {
          fingerprint,
          error: (data as { error?: string }).error || 'Eroare la înregistrarea dispozitivului',
        }
      }

      return { fingerprint }
    })()
  }

  return registrationPromise
}
