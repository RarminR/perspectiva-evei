import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    guideAccess: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    guide: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'
import { getGuideContent, getUserGuides } from './guide'

describe('Guide Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getGuideContent', () => {
    it('returns guide content when user has access', async () => {
      vi.mocked(prisma.guideAccess.findUnique).mockResolvedValue({
        id: 'access-1',
        userId: 'user-1',
        guideId: 'guide-1',
      } as any)
      vi.mocked(prisma.guide.findUnique).mockResolvedValue({
        id: 'guide-1',
        title: 'Ghid ADO',
        slug: 'ghid-ado',
        coverImage: 'cover.jpg',
        contentJson: { pages: ['Pagina 1', 'Pagina 2'] },
      } as any)

      const result = await getGuideContent('guide-1', 'user-1')

      expect(prisma.guideAccess.findUnique).toHaveBeenCalledWith({
        where: { userId_guideId: { userId: 'user-1', guideId: 'guide-1' } },
      })
      expect(prisma.guide.findUnique).toHaveBeenCalledWith({
        where: { id: 'guide-1' },
        select: {
          id: true,
          title: true,
          slug: true,
          contentJson: true,
          coverImage: true,
        },
      })
      expect(result).toEqual({
        id: 'guide-1',
        title: 'Ghid ADO',
        slug: 'ghid-ado',
        coverImage: 'cover.jpg',
        contentJson: { pages: ['Pagina 1', 'Pagina 2'] },
      })
    })

    it('returns null when user has no GuideAccess record', async () => {
      vi.mocked(prisma.guideAccess.findUnique).mockResolvedValue(null)

      const result = await getGuideContent('guide-1', 'user-2')

      expect(result).toBeNull()
      expect(prisma.guide.findUnique).not.toHaveBeenCalled()
    })

    it("returns null when guide doesn't exist", async () => {
      vi.mocked(prisma.guideAccess.findUnique).mockResolvedValue({
        id: 'access-2',
        userId: 'user-1',
        guideId: 'missing-guide',
      } as any)
      vi.mocked(prisma.guide.findUnique).mockResolvedValue(null)

      const result = await getGuideContent('missing-guide', 'user-1')

      expect(result).toBeNull()
    })
  })

  describe('getUserGuides', () => {
    it('returns list of guides user has purchased', async () => {
      vi.mocked(prisma.guideAccess.findMany).mockResolvedValue([
        {
          id: 'access-2',
          guideId: 'guide-2',
          guide: {
            id: 'guide-2',
            title: 'Ghid Manifestare',
            slug: 'ghid-manifestare',
            coverImage: null,
            description: 'Descriere 2',
          },
        },
        {
          id: 'access-1',
          guideId: 'guide-1',
          guide: {
            id: 'guide-1',
            title: 'Ghid ADO',
            slug: 'ghid-ado',
            coverImage: 'cover.jpg',
            description: 'Descriere 1',
          },
        },
      ] as any)

      const result = await getUserGuides('user-1')

      expect(prisma.guideAccess.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          guide: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
              description: true,
            },
          },
        },
        orderBy: { grantedAt: 'desc' },
      })
      expect(result).toEqual([
        {
          id: 'guide-2',
          title: 'Ghid Manifestare',
          slug: 'ghid-manifestare',
          coverImage: null,
          description: 'Descriere 2',
        },
        {
          id: 'guide-1',
          title: 'Ghid ADO',
          slug: 'ghid-ado',
          coverImage: 'cover.jpg',
          description: 'Descriere 1',
        },
      ])
    })

    it('returns empty array when user has no guides', async () => {
      vi.mocked(prisma.guideAccess.findMany).mockResolvedValue([] as any)

      const result = await getUserGuides('user-no-guides')

      expect(result).toEqual([])
    })
  })
})
