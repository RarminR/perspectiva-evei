import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getSignedCdnUrl } from '@/services/bunny'

export async function GET(
  _req: Request,
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

  const signedUrl = getSignedCdnUrl(guide.pdfKey, 300)

  // Proxy the PDF through our server to avoid X-Frame-Options blocking
  const pdfRes = await fetch(signedUrl)
  if (!pdfRes.ok) {
    return NextResponse.json({ error: 'Eroare la încărcarea PDF-ului' }, { status: 502 })
  }

  // Stream the response to handle large PDFs without buffering
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
