import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  if (!body.accessExpiresAt) {
    return NextResponse.json({ error: 'accessExpiresAt este obligatoriu' }, { status: 400 })
  }

  const accessExpiresAt = new Date(body.accessExpiresAt)
  if (Number.isNaN(accessExpiresAt.getTime())) {
    return NextResponse.json({ error: 'Dată invalidă' }, { status: 400 })
  }

  const existing = await prisma.courseEnrollment.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Înscrierea nu a fost găsită' }, { status: 404 })
  }

  const enrollment = await prisma.courseEnrollment.update({
    where: { id },
    data: {
      accessExpiresAt,
      status: accessExpiresAt > new Date() ? 'ACTIVE' : 'EXPIRED',
    },
  })
  return NextResponse.json({ enrollment })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.courseEnrollment.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Înscrierea nu a fost găsită' }, { status: 404 })
  }

  await prisma.courseEnrollment.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
