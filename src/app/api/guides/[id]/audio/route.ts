import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getSignedCdnUrl } from '@/services/bunny'

// Expiry covers a full listening session: some browsers resolve the media
// redirect once and send all subsequent Range requests straight to the CDN.
const AUDIO_URL_EXPIRY_SECONDS = 21600

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const userId = (session.user as any).id as string
  const { id } = await params

  const guide = await prisma.guide.findUnique({
    where: { id },
    select: { audioKey: true },
  })

  if (!guide || !guide.audioKey) {
    return NextResponse.json({ error: 'Ghid inexistent sau fără audio' }, { status: 404 })
  }

  const access = await prisma.guideAccess.findUnique({
    where: { userId_guideId: { userId, guideId: id } },
  })

  if (!access) {
    return NextResponse.json({ error: 'Nu ai acces la acest ghid' }, { status: 403 })
  }

  // Redirect to the token-signed CDN URL so the audio streams directly from
  // Bunny (with proper Range support) instead of being proxied through a
  // Vercel Function — proxying counted every played byte as Fast Origin
  // Transfer and ignored Range requests, re-fetching the whole file each time.
  const signedUrl = getSignedCdnUrl(guide.audioKey, AUDIO_URL_EXPIRY_SECONDS)

  return NextResponse.redirect(signedUrl, {
    status: 302,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
