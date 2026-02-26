import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { validateDevice } from '@/services/device'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { fingerprint } = await req.json()
  if (!fingerprint) {
    return NextResponse.json({ error: 'Fingerprint lipsă' }, { status: 400 })
  }

  const isValid = await validateDevice((session.user as any).id, fingerprint)
  if (!isValid) {
    return NextResponse.json({ error: 'Dispozitiv neautorizat' }, { status: 403 })
  }

  return NextResponse.json({ valid: true })
}
