import { NextRequest, NextResponse } from 'next/server'
import { checkExpiredEnrollments } from '@/services/course-expiry'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const count = await checkExpiredEnrollments()
  return NextResponse.json({ expired: count })
}
