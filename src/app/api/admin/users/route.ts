import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  }

  const search = req.nextUrl.searchParams.get('search')

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {},
    include: { _count: { select: { devices: true, orders: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ users })
}
