import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { parse } from 'csv-parse/sync'
import * as fs from 'fs'

// Memberstack plan ID → CourseEdition ID mapping
// Populate with actual Memberstack plan IDs after DB is seeded
const PLAN_TO_EDITION_MAP: Record<string, string> = {
  // 'pln_xxx': 'edition-id-from-db'
}

export interface MemberstackUser {
  email: string
  name: string
  phone?: string
  planIds: string[]
  createdAt?: string
}

export interface MigrationStats {
  migrated: number
  skipped: number
  failed: number
  errors: string[]
}

export function parseMemberstackCSV(csvContent: string): MemberstackUser[] {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[]

  return records.map((row) => {
    const hasNameColumn = 'name' in row && row.name.trim() !== ''
    const name = hasNameColumn
      ? row.name
      : [row.firstName, row.lastName].filter(Boolean).join(' ')

    const rawPlanIds = row.planIds?.trim() || ''
    const planIds = rawPlanIds ? rawPlanIds.split('|').filter(Boolean) : []

    return {
      email: row.email,
      name,
      phone: row.phone?.trim() || undefined,
      planIds,
      createdAt: row.createdAt?.trim() || undefined,
    }
  })
}

export async function migrateUser(
  user: MemberstackUser,
  dryRun: boolean = false
): Promise<'migrated' | 'skipped' | 'failed'> {
  if (dryRun) {
    console.log(`[DRY RUN] Would migrate user: ${user.email}`)
    return 'migrated'
  }

  const existing = await prisma.user.findUnique({
    where: { email: user.email },
  })

  if (existing) {
    console.log(`[SKIP] User already exists: ${user.email}`)
    return 'skipped'
  }

  const hashedPassword = await bcrypt.hash('TempPass123!', 12)

  await prisma.user.create({
    data: {
      email: user.email,
      name: user.name,
      hashedPassword,
      phone: user.phone,
      role: 'USER',
    },
  })

  console.log(`[MIGRATED] ${user.email}`)
  return 'migrated'
}

export async function mapMemberships(
  userId: string,
  planIds: string[],
  dryRun: boolean = false
): Promise<void> {
  for (const planId of planIds) {
    const editionId = PLAN_TO_EDITION_MAP[planId]
    if (!editionId) {
      continue
    }

    if (dryRun) {
      console.log(`[DRY RUN] Would enroll user ${userId} in edition ${editionId}`)
      continue
    }

    await prisma.courseEnrollment.create({
      data: {
        userId,
        courseEditionId: editionId,
        status: 'ACTIVE',
      },
    })
  }
}

export async function runMigration(options: {
  inputFile: string
  dryRun: boolean
}): Promise<MigrationStats> {
  const { inputFile, dryRun } = options
  const csvContent = fs.readFileSync(inputFile, 'utf-8')
  const users = parseMemberstackCSV(csvContent)

  const stats: MigrationStats = {
    migrated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }

  for (const user of users) {
    try {
      const result = await migrateUser(user, dryRun)
      stats[result]++

      if (result === 'migrated' && !dryRun) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        })
        if (dbUser) {
          await mapMemberships(dbUser.id, user.planIds, dryRun)
        }
      }
    } catch (error) {
      stats.failed++
      const message = error instanceof Error ? error.message : String(error)
      stats.errors.push(`${user.email}: ${message}`)
    }
  }

  return stats
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const inputIdx = args.indexOf('--input')
  const inputFile = inputIdx >= 0 ? args[inputIdx + 1] : 'memberstack-export.csv'

  runMigration({ inputFile, dryRun })
    .then((stats) => {
      console.log(`\nMigration ${dryRun ? '(DRY RUN) ' : ''}complete:`)
      console.log(`  Migrated: ${stats.migrated}`)
      console.log(`  Skipped: ${stats.skipped}`)
      console.log(`  Failed: ${stats.failed}`)
      if (stats.errors.length > 0) {
        console.log('Errors:')
        stats.errors.forEach((e) => console.log(`  - ${e}`))
      }
    })
    .catch(console.error)
}
