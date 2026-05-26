import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from 'dotenv'

config({ path: '.env.local' })

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

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter } as any)

  const marked = await prisma.user.findMany({
    where: { onboardingEmailSentAt: { not: null } },
    select: { id: true, email: true },
  })

  const toReset = marked.filter((u) => u.email && !SENT_EMAILS.has(u.email))

  if (toReset.length === 0) {
    console.log('Nothing to reset.')
    await prisma.$disconnect()
    return
  }

  console.log(`Resetting ${toReset.length} users:`)
  toReset.forEach((u) => console.log(' -', u.email))

  const { count } = await prisma.user.updateMany({
    where: { id: { in: toReset.map((u) => u.id) } },
    data: { onboardingEmailSentAt: null },
  })

  console.log(`\nDone — reset ${count} users.`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
