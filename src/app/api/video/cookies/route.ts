import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateSignedCookies } from '@/services/aws-video'
import { checkAccess } from '@/services/course'
import { validateDevice } from '@/services/device'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const userId = (session.user as any).id as string
  const editionId = req.nextUrl.searchParams.get('editionId')

  if (!editionId) {
    return NextResponse.json({ error: 'editionId lipsă' }, { status: 400 })
  }

  const fingerprint = req.headers.get('x-device-fingerprint')
  if (!fingerprint) {
    return NextResponse.json({ error: 'Fingerprint lipsă' }, { status: 400 })
  }

  const isValidDevice = await validateDevice(userId, fingerprint)
  if (!isValidDevice) {
    return NextResponse.json({ error: 'Dispozitiv neautorizat' }, { status: 403 })
  }

  const hasAccess = await checkAccess(userId, editionId)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Nu ai acces la acest curs.' }, { status: 403 })
  }

  const { cookies, cookieOptions } = await generateSignedCookies(userId)
  const response = NextResponse.json({ success: true })

  response.cookies.set('CloudFront-Policy', cookies['CloudFront-Policy']!, cookieOptions)
  response.cookies.set('CloudFront-Signature', cookies['CloudFront-Signature']!, cookieOptions)
  response.cookies.set('CloudFront-Key-Pair-Id', cookies['CloudFront-Key-Pair-Id']!, cookieOptions)

  return response
}
