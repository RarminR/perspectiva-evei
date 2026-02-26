import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { removeDevice } from '@/services/device'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const result = await removeDevice((session.user as any).id, params.id)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
