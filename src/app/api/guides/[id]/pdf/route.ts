import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getSignedUrl } from '@aws-sdk/cloudfront-signer'

const URL_TTL_SECONDS = 300

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

  const domain = process.env.AWS_CLOUDFRONT_DOMAIN
  const keyPairId = process.env.AWS_CLOUDFRONT_KEY_PAIR_ID
  const privateKeyBase64 = process.env.AWS_CLOUDFRONT_PRIVATE_KEY

  if (!domain || !keyPairId || !privateKeyBase64) {
    return NextResponse.json({ error: 'Configurare lipsă' }, { status: 500 })
  }

  const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8')
  const resourceUrl = `https://${domain}/${guide.pdfKey}`
  const expires = new Date(Date.now() + URL_TTL_SECONDS * 1000)

  const signedUrl = getSignedUrl({
    url: resourceUrl,
    keyPairId,
    privateKey,
    dateLessThan: expires.toISOString(),
  })

  return NextResponse.json({ url: signedUrl })
}
