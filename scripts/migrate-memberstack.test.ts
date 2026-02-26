import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/lib/db
vi.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
    courseEnrollment: { create: vi.fn() },
    guideAccess: { create: vi.fn() },
  },
}))

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-password') },
}))

// Mock fs
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}))

import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import {
  parseMemberstackCSV,
  migrateUser,
  mapMemberships,
  runMigration,
  type MemberstackUser,
} from './migrate-memberstack'

describe('Memberstack Migration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseMemberstackCSV', () => {
    it('parses CSV rows into MemberstackUser objects', () => {
      const csv = `email,name,phone,planIds,createdAt
ana@test.com,Ana Popescu,+40712345678,pln_001|pln_002,2025-01-15
ion@test.com,Ion Ionescu,+40798765432,pln_001,2025-03-20`

      const result = parseMemberstackCSV(csv)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        email: 'ana@test.com',
        name: 'Ana Popescu',
        phone: '+40712345678',
        planIds: ['pln_001', 'pln_002'],
        createdAt: '2025-01-15',
      })
      expect(result[1]).toEqual({
        email: 'ion@test.com',
        name: 'Ion Ionescu',
        phone: '+40798765432',
        planIds: ['pln_001'],
        createdAt: '2025-03-20',
      })
    })

    it('handles missing optional fields gracefully', () => {
      const csv = `email,name,phone,planIds,createdAt
maria@test.com,Maria Dumitrescu,,,`

      const result = parseMemberstackCSV(csv)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        email: 'maria@test.com',
        name: 'Maria Dumitrescu',
        phone: undefined,
        planIds: [],
        createdAt: undefined,
      })
    })

    it('handles firstName + lastName columns when name column is absent', () => {
      const csv = `email,firstName,lastName,phone,planIds,createdAt
test@test.com,Elena,Vasile,,pln_003,2025-06-01`

      const result = parseMemberstackCSV(csv)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Elena Vasile')
    })
  })

  describe('migrateUser', () => {
    it('creates a new user with hashed temp password', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'user-1',
        email: 'new@test.com',
        name: 'New User',
        hashedPassword: 'hashed-password',
        phone: null,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const user: MemberstackUser = {
        email: 'new@test.com',
        name: 'New User',
        planIds: [],
      }

      const result = await migrateUser(user, false)

      expect(result).toBe('migrated')
      expect(bcrypt.hash).toHaveBeenCalledWith('TempPass123!', 12)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@test.com',
          name: 'New User',
          hashedPassword: 'hashed-password',
          phone: undefined,
          role: 'USER',
        },
      })
    })

    it('skips duplicate email (user already exists)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: 'existing@test.com',
        name: 'Existing',
        hashedPassword: 'hash',
        phone: null,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const user: MemberstackUser = {
        email: 'existing@test.com',
        name: 'Existing',
        planIds: [],
      }

      const result = await migrateUser(user, false)

      expect(result).toBe('skipped')
      expect(prisma.user.create).not.toHaveBeenCalled()
    })

    it('in dry-run mode does NOT write to database', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const user: MemberstackUser = {
        email: 'dry@test.com',
        name: 'Dry Run User',
        planIds: [],
      }

      const result = await migrateUser(user, true)

      expect(result).toBe('migrated')
      expect(prisma.user.create).not.toHaveBeenCalled()
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('mapMemberships', () => {
    it('maps Memberstack plan IDs to CourseEnrollment records', async () => {
      await mapMemberships('user-1', ['pln_001'], false)

      // PLAN_TO_EDITION_MAP is empty by default, so no enrollments created
      expect(prisma.courseEnrollment.create).not.toHaveBeenCalled()
    })

    it('does not create enrollments in dry-run mode', async () => {
      await mapMemberships('user-1', ['pln_001'], true)

      expect(prisma.courseEnrollment.create).not.toHaveBeenCalled()
    })
  })

  describe('runMigration', () => {
    it('returns stats: migrated, skipped, failed', async () => {
      const csvContent = `email,name,phone,planIds,createdAt
user1@test.com,User One,,,
user2@test.com,User Two,,,`

      vi.mocked(fs.readFileSync).mockReturnValue(csvContent)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create)
        .mockResolvedValueOnce({
          id: 'u1', email: 'user1@test.com', name: 'User One',
          hashedPassword: 'h', phone: null, role: 'USER',
          createdAt: new Date(), updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'u2', email: 'user2@test.com', name: 'User Two',
          hashedPassword: 'h', phone: null, role: 'USER',
          createdAt: new Date(), updatedAt: new Date(),
        })

      const stats = await runMigration({ inputFile: 'test.csv', dryRun: false })

      expect(stats.migrated).toBe(2)
      expect(stats.skipped).toBe(0)
      expect(stats.failed).toBe(0)
      expect(stats.errors).toEqual([])
    })

    it('in dry-run mode returns stats without DB writes', async () => {
      const csvContent = `email,name,phone,planIds,createdAt
dry1@test.com,Dry One,,,
dry2@test.com,Dry Two,,,`

      vi.mocked(fs.readFileSync).mockReturnValue(csvContent)

      const stats = await runMigration({ inputFile: 'test.csv', dryRun: true })

      expect(stats.migrated).toBe(2)
      expect(stats.skipped).toBe(0)
      expect(stats.failed).toBe(0)
      expect(prisma.user.create).not.toHaveBeenCalled()
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('tracks failed migrations in errors array', async () => {
      const csvContent = `email,name,phone,planIds,createdAt
fail@test.com,Fail User,,,`

      vi.mocked(fs.readFileSync).mockReturnValue(csvContent)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockRejectedValue(new Error('DB connection failed'))

      const stats = await runMigration({ inputFile: 'test.csv', dryRun: false })

      expect(stats.migrated).toBe(0)
      expect(stats.failed).toBe(1)
      expect(stats.errors).toHaveLength(1)
      expect(stats.errors[0]).toContain('fail@test.com')
    })
  })
})
