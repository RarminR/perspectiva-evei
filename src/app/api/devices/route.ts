import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listDevices, registerDevice } from '@/services/device'

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const devices = await listDevices((session.user as any).id)
  return NextResponse.json({ devices })
}

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { fingerprint, deviceName } = await req.json()
  if (!fingerprint) {
    return NextResponse.json({ error: 'Fingerprint lipsă' }, { status: 400 })
  }

  const result = await registerDevice(
    (session.user as any).id,
    fingerprint,
    deviceName || 'Dispozitiv necunoscut'
  )

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 403 })
  }

  return NextResponse.json({ deviceId: result.deviceId }, { status: 201 })
}
