import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { extendAccess } from '@/services/course-expiry'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { enrollmentId } = await request.json()
  if (!enrollmentId) {
    return NextResponse.json({ error: 'enrollmentId required' }, { status: 400 })
  }

  await extendAccess(enrollmentId)
  return NextResponse.json({ success: true })
}
