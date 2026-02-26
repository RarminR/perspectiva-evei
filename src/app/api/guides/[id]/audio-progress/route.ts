import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/guides/[id]/audio-progress
 * Returns saved audio position for the current user.
 *
 * NOTE: GuideAccess does not have an `audioPosition` field yet.
 * When schema is migrated, uncomment the prisma query below.
 * For now, the component uses localStorage as primary persistence.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id

  // Verify user has access to this guide
  const access = await prisma.guideAccess.findUnique({
    where: { userId_guideId: { userId, guideId: params.id } },
  })

  if (!access) {
    return NextResponse.json({ error: 'Nu ai acces la acest ghid.' }, { status: 403 })
  }

  // TODO: When audioPosition field is added to GuideAccess schema:
  // return NextResponse.json({ position: access.audioPosition || 0 })
  return NextResponse.json({ position: 0 })
}

/**
 * POST /api/guides/[id]/audio-progress
 * Saves audio position for the current user.
 * Body: { position: number } (seconds)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id
  const { position } = await req.json()

  if (typeof position !== 'number' || position < 0) {
    return NextResponse.json({ error: 'Poziție invalidă' }, { status: 400 })
  }

  // Verify user has access
  const access = await prisma.guideAccess.findUnique({
    where: { userId_guideId: { userId, guideId: params.id } },
  })

  if (!access) {
    return NextResponse.json({ error: 'Nu ai acces la acest ghid.' }, { status: 403 })
  }

  // TODO: When audioPosition field is added to GuideAccess schema:
  // await prisma.guideAccess.update({
  //   where: { userId_guideId: { userId, guideId: params.id } },
  //   data: { audioPosition: position },
  // })

  return NextResponse.json({ success: true })
}
