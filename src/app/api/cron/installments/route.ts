import { NextRequest, NextResponse } from 'next/server'
import { processInstallmentReminders } from '@/services/installment-cron'

async function authorize(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(request: NextRequest) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const stats = await processInstallmentReminders()
  return NextResponse.json(stats)
}

export async function POST(request: NextRequest) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const stats = await processInstallmentReminders()
  return NextResponse.json(stats)
}
