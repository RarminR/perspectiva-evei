import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  }

  const sessions = await prisma.session1on1.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { scheduledAt: 'desc' },
  })

  return NextResponse.json({ sessions })
}
