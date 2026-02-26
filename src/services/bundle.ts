import { prisma } from '@/lib/db'

export async function getBundleWithItems(bundleSlug: string) {
  return prisma.bundle.findUnique({
    where: { slug: bundleSlug },
    include: {
      items: {
        include: {
          guide: { select: { id: true, title: true, price: true, slug: true } },
        },
      },
    },
  })
}

export async function calculateBundleDiscount(bundleId: string): Promise<{
  bundlePrice: number
  individualTotal: number
  savingsAmount: number
  savingsPercent: number
}> {
  const bundle = await prisma.bundle.findUnique({
    where: { id: bundleId },
    include: {
      items: {
        include: { guide: { select: { price: true } } },
      },
    },
  })

  if (!bundle) throw new Error('Bundle-ul nu a fost găsit.')

  const individualTotal = bundle.items.reduce(
    (sum: number, item: { guide: { price: number } }) => sum + (item.guide.price || 0),
    0
  )
  const bundlePrice = bundle.price
  const savingsAmount = individualTotal - bundlePrice
  const savingsPercent =
    individualTotal > 0
      ? Math.round((savingsAmount / individualTotal) * 100)
      : 0

  return { bundlePrice, individualTotal, savingsAmount, savingsPercent }
}
