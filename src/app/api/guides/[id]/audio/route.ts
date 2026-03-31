import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getSignedCdnUrl } from '@/services/bunny'

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

  const signedUrl = getSignedCdnUrl(guide.audioKey, 3600)

  // Proxy audio through our server to avoid CORS/CSP issues
  const audioRes = await fetch(signedUrl)
  if (!audioRes.ok) {
    return NextResponse.json({ error: 'Eroare la încărcarea audio' }, { status: 502 })
  }

  return new NextResponse(audioRes.body, {
    headers: {
      'Content-Type': audioRes.headers.get('content-type') || 'audio/mpeg',
      'Cache-Control': 'private, no-store',
      'Accept-Ranges': 'bytes',
      ...(audioRes.headers.get('content-length')
        ? { 'Content-Length': audioRes.headers.get('content-length')! }
        : {}),
    },
  })
}
