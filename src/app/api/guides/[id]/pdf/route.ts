import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getSignedCdnUrl } from '@/services/bunny'

const PDF_URL_EXPIRY_SECONDS = 3600

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const userId = (session.user as any).id as string
  const { id } = await params

  const guide = await prisma.guide.findUnique({
    where: { id },
    select: { pdfKey: true },
  })

  if (!guide || !guide.pdfKey) {
    return NextResponse.json({ error: 'Ghid inexistent sau fără PDF' }, { status: 404 })
  }

  const access = await prisma.guideAccess.findUnique({
    where: { userId_guideId: { userId, guideId: id } },
  })

  if (!access) {
    return NextResponse.json({ error: 'Nu ai acces la acest ghid' }, { status: 403 })
  }

  const signedUrl = getSignedCdnUrl(guide.pdfKey, PDF_URL_EXPIRY_SECONDS)

  // Fallback for browsers blocked by missing CORS config on the CDN pull
  // zone: stream the file through the function. This counts as Fast Origin
  // Transfer, so it is only used when the direct CDN fetch fails.
  if (req.nextUrl.searchParams.get('mode') === 'proxy') {
    const pdfRes = await fetch(signedUrl)
    if (!pdfRes.ok) {
      return NextResponse.json({ error: 'Eroare la încărcarea PDF-ului' }, { status: 502 })
    }
    return new NextResponse(pdfRes.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-store',
        ...(pdfRes.headers.get('content-length')
          ? { 'Content-Length': pdfRes.headers.get('content-length')! }
          : {}),
      },
    })
  }

  // Default: redirect so the PDF downloads directly from Bunny CDN instead
  // of flowing through a Vercel Function (Fast Origin Transfer).
  return NextResponse.redirect(signedUrl, {
    status: 302,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
