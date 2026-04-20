import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SESSION_PRICING } from '@/lib/constants/pricing'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const productType = searchParams.get('productType')
  const productId = searchParams.get('id')
  const paymentType = searchParams.get('paymentType') || 'full'

  if (!productType) {
    return NextResponse.json({ error: 'productType lipsă' }, { status: 400 })
  }

  try {
    if (productType === 'COURSE') {
      const edition = await prisma.courseEdition.findFirst({
        where: { enrollmentOpen: true },
        include: { course: true },
        orderBy: { editionNumber: 'desc' },
      })

      if (!edition) {
        return NextResponse.json({ error: 'Nicio ediție activă' }, { status: 404 })
      }

      const priceEur = paymentType === 'installment'
        ? (edition.course.installmentPrice ?? edition.course.price)
        : edition.course.price

      return NextResponse.json({
        productId: edition.id,
        productType: 'COURSE',
        name: `${edition.course.title} — Ediția ${edition.editionNumber}`,
        priceEur,
        priceEurCents: Math.round(priceEur * 100),
        paymentType,
      })
    }

    if (productType === 'GUIDE') {
      if (!productId) {
        return NextResponse.json({ error: 'id lipsă pentru ghid' }, { status: 400 })
      }

      const guide = await prisma.guide.findUnique({ where: { id: productId } })
      if (!guide) {
        return NextResponse.json({ error: 'Ghidul nu a fost găsit' }, { status: 404 })
      }

      return NextResponse.json({
        productId: guide.id,
        productType: 'GUIDE',
        name: guide.title,
        priceEur: guide.price,
        priceEurCents: Math.round(guide.price * 100),
      })
    }

    if (productType === 'BUNDLE') {
      if (!productId) {
        return NextResponse.json({ error: 'id lipsă pentru bundle' }, { status: 400 })
      }

      const bundle = await prisma.bundle.findUnique({ where: { id: productId } })
      if (!bundle) {
        return NextResponse.json({ error: 'Bundle-ul nu a fost găsit' }, { status: 404 })
      }

      return NextResponse.json({
        productId: bundle.id,
        productType: 'BUNDLE',
        name: bundle.title,
        priceEur: bundle.price,
        priceEurCents: Math.round(bundle.price * 100),
      })
    }

    if (productType === 'SESSION') {
      const scheduledAtParam = searchParams.get('scheduledAt')
      if (!scheduledAtParam) {
        return NextResponse.json(
          { error: 'Slot invalid pentru ședință.' },
          { status: 400 }
        )
      }
      const scheduledAt = new Date(scheduledAtParam)
      if (Number.isNaN(scheduledAt.getTime())) {
        return NextResponse.json({ error: 'Data slotului invalidă.' }, { status: 400 })
      }
      if (scheduledAt.getTime() < Date.now()) {
        return NextResponse.json({ error: 'Slotul ales e în trecut.' }, { status: 400 })
      }

      const conflict = await prisma.session1on1.findFirst({
        where: { scheduledAt, status: 'BOOKED' },
      })
      if (conflict) {
        return NextResponse.json({ error: 'Slotul ales tocmai a fost rezervat.' }, { status: 409 })
      }

      const isoSlot = scheduledAt.toISOString()
      const formatted = scheduledAt.toLocaleString('ro-RO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

      return NextResponse.json({
        productId: isoSlot,
        productType: 'SESSION',
        name: `${SESSION_PRICING.PRODUCT_NAME} — ${formatted}`,
        priceEur: SESSION_PRICING.PRICE_EUR,
        priceEurCents: SESSION_PRICING.PRICE_EUR * 100,
      })
    }

    return NextResponse.json({ error: 'Tip de produs necunoscut' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Eroare la rezolvarea produsului' }, { status: 500 })
  }
}
