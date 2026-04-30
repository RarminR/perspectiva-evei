import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Courses (we treat them as always-listable; ADO is the only one)
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, price: true },
    orderBy: { createdAt: 'asc' },
  })

  // Guides — only published ones; gracefully fall back if column missing
  let guides: { id: string; title: string; price: number }[] = []
  try {
    guides = await prisma.guide.findMany({
      where: { published: true },
      select: { id: true, title: true, price: true },
      orderBy: { createdAt: 'asc' },
    })
  } catch {
    guides = await prisma.guide.findMany({
      select: { id: true, title: true, price: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  // Bundles — only active
  const bundles = await prisma.bundle.findMany({
    where: { active: true },
    select: { id: true, title: true, price: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    products: [
      ...courses.map((c) => ({ type: 'COURSE' as const, id: c.id, title: c.title, price: c.price })),
      ...guides.map((g) => ({ type: 'GUIDE' as const, id: g.id, title: g.title, price: g.price })),
      ...bundles.map((b) => ({ type: 'BUNDLE' as const, id: b.id, title: b.title, price: b.price })),
    ],
  })
}
