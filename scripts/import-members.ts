import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { parse } from 'csv-parse/sync'
import { config } from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

// Memberstack plan ID → guide slug(s) to grant access to.
// Bundle plan grants access to both guides in the bundle.
const PLAN_TO_GUIDE_SLUGS: Record<string, string[]> = {
  'pln_cine-manifest--aq1f20nj2': ['cine-manifesta'],
  'pln_este-despre-mine-ghid-de-manifestare-con-tient--tua20bgo': ['este-despre-mine'],
  'pln_produs-2-z1ax0qox': ['este-tot-despre-mine'],
  'pln_pachet-de-ghiduri-de-manifestare-con-tient--2p1ai04lf': [
    'este-despre-mine',
    'este-tot-despre-mine',
  ],
}

interface CsvRow {
  'Member ID': string
  Email: string
  'First Name': string
  'Last Name': string
  'Plan ID': string
}

interface MemberAggregate {
  email: string
  name: string
  planIds: Set<string>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

function buildName(first: string, last: string): string {
  const name = [first?.trim(), last?.trim()].filter(Boolean).join(' ')
  return name || ''
}

function aggregate(rows: CsvRow[]): { members: MemberAggregate[]; skippedEmails: string[] } {
  const byEmail = new Map<string, MemberAggregate>()
  const skippedEmails: string[] = []

  for (const row of rows) {
    const email = row.Email?.trim().toLowerCase()
    if (!email) continue
    if (!EMAIL_RE.test(email)) {
      if (!skippedEmails.includes(email)) skippedEmails.push(email)
      continue
    }

    const existing = byEmail.get(email)
    if (existing) {
      const planId = row['Plan ID']?.trim()
      if (planId) existing.planIds.add(planId)
      if (!existing.name) existing.name = buildName(row['First Name'], row['Last Name'])
    } else {
      const planIds = new Set<string>()
      const planId = row['Plan ID']?.trim()
      if (planId) planIds.add(planId)
      byEmail.set(email, {
        email,
        name: buildName(row['First Name'], row['Last Name']),
        planIds,
      })
    }
  }

  return { members: Array.from(byEmail.values()), skippedEmails }
}

async function loadGuideIdsBySlug(): Promise<Map<string, string>> {
  const slugs = Array.from(new Set(Object.values(PLAN_TO_GUIDE_SLUGS).flat()))
  const guides = await prisma.guide.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  })
  const map = new Map<string, string>()
  for (const g of guides) map.set(g.slug, g.id)

  const missing = slugs.filter((s) => !map.has(s))
  if (missing.length > 0) {
    throw new Error(
      `Missing guides in DB for slugs: ${missing.join(', ')}. Seed them before running this script.`
    )
  }
  return map
}

interface ImportStats {
  usersCreated: number
  usersUpdated: number
  guideAccessCreated: number
  guideAccessSkipped: number
  membersWithoutGuides: number
  unknownPlans: Map<string, number>
  badEmails: string[]
}

async function importMembers(csvPath: string, dryRun: boolean): Promise<ImportStats> {
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
  }) as CsvRow[]

  const { members, skippedEmails } = aggregate(rows)
  const guideIdsBySlug = await loadGuideIdsBySlug()

  const stats: ImportStats = {
    usersCreated: 0,
    usersUpdated: 0,
    guideAccessCreated: 0,
    guideAccessSkipped: 0,
    membersWithoutGuides: 0,
    unknownPlans: new Map(),
    badEmails: skippedEmails,
  }

  for (const member of members) {
    const grantedSlugs = new Set<string>()
    for (const planId of member.planIds) {
      const slugs = PLAN_TO_GUIDE_SLUGS[planId]
      if (!slugs) {
        stats.unknownPlans.set(planId, (stats.unknownPlans.get(planId) ?? 0) + 1)
        continue
      }
      slugs.forEach((s) => grantedSlugs.add(s))
    }

    if (grantedSlugs.size === 0) {
      stats.membersWithoutGuides++
    }

    if (dryRun) {
      const tag =
        grantedSlugs.size > 0
          ? `guides: ${Array.from(grantedSlugs).join(', ')}`
          : 'no guides (user only)'
      console.log(`[DRY] ${member.email} → ${tag}`)
      continue
    }

    const existing = await prisma.user.findUnique({ where: { email: member.email } })
    let userId: string
    if (existing) {
      userId = existing.id
      if (!existing.name && member.name) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { name: member.name },
        })
        stats.usersUpdated++
      }
    } else {
      const created = await prisma.user.create({
        data: {
          email: member.email,
          name: member.name || member.email.split('@')[0],
          role: 'USER',
        },
      })
      userId = created.id
      stats.usersCreated++
    }

    for (const slug of grantedSlugs) {
      const guideId = guideIdsBySlug.get(slug)!
      const exists = await prisma.guideAccess.findUnique({
        where: { userId_guideId: { userId, guideId } },
      })
      if (exists) {
        stats.guideAccessSkipped++
        continue
      }
      await prisma.guideAccess.create({ data: { userId, guideId } })
      stats.guideAccessCreated++
    }
  }

  return stats
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const inputIdx = args.indexOf('--input')
  const inputFile =
    inputIdx >= 0
      ? args[inputIdx + 1]
      : path.join(process.cwd(), 'members_plans_long.csv')

  console.log(`📥 Importing members from ${inputFile}${dryRun ? ' (DRY RUN)' : ''}\n`)

  const stats = await importMembers(inputFile, dryRun)

  console.log('\n✅ Import complete')
  console.log(`  Users created:         ${stats.usersCreated}`)
  console.log(`  Users updated:         ${stats.usersUpdated}`)
  console.log(`  GuideAccess created:   ${stats.guideAccessCreated}`)
  console.log(`  GuideAccess existed:   ${stats.guideAccessSkipped}`)
  console.log(`  Users without guides:   ${stats.membersWithoutGuides}`)

  if (stats.unknownPlans.size > 0) {
    console.log(`\n  Unknown plan IDs (skipped):`)
    for (const [planId, count] of stats.unknownPlans) {
      console.log(`    ${planId}: ${count}x`)
    }
  }

  if (stats.badEmails.length > 0) {
    console.log(`\n  Skipped malformed emails (${stats.badEmails.length}):`)
    stats.badEmails.forEach((e) => console.log(`    ${e}`))
  }
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
