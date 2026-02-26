import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listDevices, removeDevice } from '@/services/device'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const devices = await listDevices(userId)
  return NextResponse.json({ devices })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { deviceId } = await req.json()

  if (!deviceId) {
    return NextResponse.json({ error: 'deviceId lipseste' }, { status: 400 })
  }

  const result = await removeDevice(userId, deviceId)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
