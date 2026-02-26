import { prisma } from '@/lib/db'

export async function getGuideContent(guideId: string, userId: string) {
  const access = await prisma.guideAccess.findUnique({
    where: { userId_guideId: { userId, guideId } },
  })

  if (!access) {
    return null
  }

  return prisma.guide.findUnique({
    where: { id: guideId },
    select: {
      id: true,
      title: true,
      slug: true,
      contentJson: true,
      coverImage: true,
    },
  })
}

export async function getUserGuides(userId: string) {
  const accesses = await prisma.guideAccess.findMany({
    where: { userId },
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

  return accesses.map((access) => access.guide)
}
