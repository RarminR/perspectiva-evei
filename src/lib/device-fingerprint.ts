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
