import crypto from 'crypto'

const STORAGE_API_KEY = () => process.env.BUNNY_STORAGE_API_KEY!
const STORAGE_ZONE = () => process.env.BUNNY_STORAGE_ZONE!
const STORAGE_REGION = () => process.env.BUNNY_STORAGE_REGION || 'de'
const CDN_HOSTNAME = () => process.env.BUNNY_CDN_HOSTNAME!
const CDN_TOKEN_KEY = () => process.env.BUNNY_CDN_TOKEN_KEY!
const STREAM_API_KEY = () => process.env.BUNNY_STREAM_API_KEY!
const STREAM_LIBRARY_ID = () => process.env.BUNNY_STREAM_LIBRARY_ID!
const STREAM_CDN_HOSTNAME = () => process.env.BUNNY_STREAM_CDN_HOSTNAME || ''

/**
 * Upload a file to Bunny Storage.
 * Returns the storage path (key).
 */
export async function uploadToStorage(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<string> {
  const region = STORAGE_REGION()
  const host = region === 'de'
    ? 'storage.bunnycdn.com'
    : `${region}.storage.bunnycdn.com`

  const res = await fetch(
    `https://${host}/${STORAGE_ZONE()}/${path}`,
    {
      method: 'PUT',
      headers: {
        AccessKey: STORAGE_API_KEY(),
        'Content-Type': contentType,
      },
      body: new Uint8Array(buffer),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bunny Storage upload failed: ${res.status} ${text}`)
  }

  return path
}

/**
 * Get a public CDN URL for a file (no auth, for images).
 */
export function getCdnUrl(path: string): string {
  return `https://${CDN_HOSTNAME()}/${path}`
}

/**
 * Generate a token-authenticated URL for a file on Bunny CDN.
 * Used for PDFs and other protected files.
 */
export function getSignedCdnUrl(path: string, expiresInSeconds: number = 300): string {
  const hostname = CDN_HOSTNAME()
  const tokenKey = CDN_TOKEN_KEY()
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds

  // Bunny token authentication
  // token = SHA256(security_key + sanitized_path + expires)
  const sanitizedPath = '/' + path
  const hashable = `${tokenKey}${sanitizedPath}${expires}`
  const token = crypto
    .createHash('sha256')
    .update(hashable)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `https://${hostname}${sanitizedPath}?token=${token}&expires=${expires}`
}

// ─── Bunny Stream (Video) ───────────────────────────────────────

/**
 * Create a video entry in Bunny Stream and get the upload URL.
 */
export async function createStreamVideo(title: string): Promise<{
  videoId: string
  uploadUrl: string
}> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID()}/videos`,
    {
      method: 'POST',
      headers: {
        AccessKey: STREAM_API_KEY(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bunny Stream create failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  return {
    videoId: data.guid,
    uploadUrl: `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID()}/videos/${data.guid}`,
  }
}

/**
 * Upload video binary to Bunny Stream.
 */
export async function uploadStreamVideo(videoId: string, buffer: Buffer): Promise<void> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID()}/videos/${videoId}`,
    {
      method: 'PUT',
      headers: {
        AccessKey: STREAM_API_KEY(),
        'Content-Type': 'application/octet-stream',
      },
      body: new Uint8Array(buffer),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bunny Stream upload failed: ${res.status} ${text}`)
  }
}

/**
 * Get video status/details from Bunny Stream.
 */
export async function getStreamVideo(videoId: string): Promise<{
  videoId: string
  status: number
  title: string
  length: number
}> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID()}/videos/${videoId}`,
    {
      headers: { AccessKey: STREAM_API_KEY() },
    }
  )

  if (!res.ok) {
    throw new Error(`Bunny Stream get failed: ${res.status}`)
  }

  const data = await res.json()
  return {
    videoId: data.guid,
    status: data.status,
    title: data.title,
    length: data.length,
  }
}

/**
 * Get the embed/playback URL for a Bunny Stream video.
 * Uses token authentication for security.
 */
export function getStreamEmbedUrl(videoId: string, expiresInSeconds: number = 7200): string {
  const libraryId = STREAM_LIBRARY_ID()
  const tokenKey = STREAM_API_KEY()
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds

  const token = crypto
    .createHash('sha256')
    .update(`${tokenKey}${videoId}${expires}`)
    .digest('hex')

  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`
}

/**
 * Get the direct HLS playlist URL for a Bunny Stream video.
 * Used for custom player (hls.js).
 */
export function getStreamPlaylistUrl(videoId: string, expiresInSeconds: number = 7200): string {
  const libraryId = STREAM_LIBRARY_ID()
  const cdnHostname = STREAM_CDN_HOSTNAME()
  const tokenKey = STREAM_API_KEY()
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds

  const token = crypto
    .createHash('sha256')
    .update(`${tokenKey}${videoId}${expires}`)
    .digest('hex')

  if (cdnHostname) {
    return `https://${cdnHostname}/${videoId}/playlist.m3u8?token=${token}&expires=${expires}`
  }

  return `https://iframe.mediadelivery.net/play/${libraryId}/${videoId}?token=${token}&expires=${expires}`
}

/**
 * Delete a video from Bunny Stream.
 */
export async function deleteStreamVideo(videoId: string): Promise<void> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID()}/videos/${videoId}`,
    {
      method: 'DELETE',
      headers: { AccessKey: STREAM_API_KEY() },
    }
  )

  if (!res.ok) {
    throw new Error(`Bunny Stream delete failed: ${res.status}`)
  }
}
