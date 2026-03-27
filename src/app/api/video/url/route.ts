import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkAccess } from '@/services/course'
import { validateDevice } from '@/services/device'
import { getStreamPlaylistUrl } from '@/services/bunny'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const userId = (session.user as any).id as string
  const editionId = req.nextUrl.searchParams.get('editionId')
  const videoId = req.nextUrl.searchParams.get('videoId')

  if (!editionId || !videoId) {
    return NextResponse.json({ error: 'Parametri lipsă' }, { status: 400 })
  }

  const fingerprint = req.headers.get('x-device-fingerprint')
  if (!fingerprint) {
    return NextResponse.json({ error: 'Fingerprint lipsă' }, { status: 400 })
  }

  const isValidDevice = await validateDevice(userId, fingerprint)
  if (!isValidDevice) {
    return NextResponse.json({ error: 'Dispozitiv neautorizat' }, { status: 403 })
  }

  const hasAccess = await checkAccess(userId, editionId)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Nu ai acces la acest curs.' }, { status: 403 })
  }

  const url = getStreamPlaylistUrl(videoId, 7200)

  return NextResponse.json({ url })
}
