import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

    return NextResponse.json({ error: 'Tip de produs necunoscut' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Eroare la rezolvarea produsului' }, { status: 500 })
  }
}
