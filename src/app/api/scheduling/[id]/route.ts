import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cancelSession } from '@/services/scheduling'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const userId = (session.user as any).id
    await cancelSession(id, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to cancel session'
    const status =
      message === 'Session not found'
        ? 404
        : message === 'Cannot cancel within 24 hours'
          ? 400
          : 500
    return NextResponse.json({ error: message }, { status })
  }
}
