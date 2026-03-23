import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { recordLoginActivity } from '@/services/login-activity'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'
  const userAgent = req.headers.get('user-agent') || undefined

  await recordLoginActivity(userId, ip, userAgent)

  return NextResponse.json({ ok: true })
}
