import { NextRequest, NextResponse } from 'next/server'
import { processInstallmentReminders } from '@/services/installment-cron'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stats = await processInstallmentReminders()
  return NextResponse.json(stats)
}
