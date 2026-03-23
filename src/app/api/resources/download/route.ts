import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getSignedUrl } from '@aws-sdk/cloudfront-signer'

const URL_TTL_SECONDS = 300

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const userId = (session.user as any).id as string
  const lessonId = req.nextUrl.searchParams.get('lessonId')
  const key = req.nextUrl.searchParams.get('key')

  if (!lessonId || !key) {
    return NextResponse.json({ error: 'Parametri lipsă' }, { status: 400 })
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      pdfKeys: true,
      edition: {
        select: {
          enrollments: {
            where: { userId },
            select: { id: true, accessExpiresAt: true },
          },
        },
      },
    },
  })

  if (!lesson) {
    return NextResponse.json({ error: 'Lecție inexistentă' }, { status: 404 })
  }

  const enrollment = lesson.edition.enrollments[0]
  if (!enrollment || enrollment.accessExpiresAt < new Date()) {
    return NextResponse.json({ error: 'Nu ai acces' }, { status: 403 })
  }

  if (!lesson.pdfKeys.includes(key)) {
    return NextResponse.json({ error: 'Resursă invalidă' }, { status: 403 })
  }

  const domain = process.env.AWS_CLOUDFRONT_DOMAIN
  const keyPairId = process.env.AWS_CLOUDFRONT_KEY_PAIR_ID
  const privateKeyBase64 = process.env.AWS_CLOUDFRONT_PRIVATE_KEY

  if (!domain || !keyPairId || !privateKeyBase64) {
    return NextResponse.json({ error: 'Configurare lipsă' }, { status: 500 })
  }

  const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8')
  const resourceUrl = `https://${domain}/${key}`
  const expires = new Date(Date.now() + URL_TTL_SECONDS * 1000)

  const signedUrl = getSignedUrl({
    url: resourceUrl,
    keyPairId,
    privateKey,
    dateLessThan: expires.toISOString(),
  })

  return NextResponse.json({ url: signedUrl })
}
