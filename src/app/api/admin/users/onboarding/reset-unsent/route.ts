import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const SENT_EMAILS = new Set([
  'sofia.savin2006@yahoo.com',
  'nicoleta_g96@yahoo.com',
  'alina.gabriela05@yahoo.com',
  'e.l.eme.t.a.k.i.v.e.9.0@gmail.com',
  'vasilealexandraangela@gmail.com',
  'vasilegabriela6@gmail.com',
  'luminitaioana091973@gmail.com',
  'elena_efrim@yahoo.com',
  'alinatanasa249@yahoo.com',
  'amalia.hendre@yahoo.com',
  'biancaursu915@gmail.com',
  'madalina814@gmail.com',
  'aamarin79@gmail.com',
  's.gabriela96@yahoo.com',
  'ebiqeti267@gmail.com',
  'petro.apetrii71@yahoo.com',
  'o161@ymail.com',
  'anelisse_2004@yahoo.com',
  'sofiadiana.calin@gmail.com',
])

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  if ((session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })

  const marked = await prisma.user.findMany({
    where: { onboardingEmailSentAt: { not: null } },
    select: { id: true, email: true },
  })

  const toReset = marked.filter((u) => u.email && !SENT_EMAILS.has(u.email))

  if (toReset.length === 0) {
    return NextResponse.json({ reset: 0, emails: [] })
  }

  const { count } = await prisma.user.updateMany({
    where: { id: { in: toReset.map((u) => u.id) } },
    data: { onboardingEmailSentAt: null },
  })

  return NextResponse.json({ reset: count, emails: toReset.map((u) => u.email) })
}
