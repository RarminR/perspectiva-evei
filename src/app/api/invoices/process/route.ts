import { NextResponse } from 'next/server'

import { processInvoiceQueue } from '@/services/invoice-pipeline'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processInvoiceQueue()
  return NextResponse.json(result)
}
