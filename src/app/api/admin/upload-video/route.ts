import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/lib/auth'
import { createStreamVideo } from '@/services/bunny'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  try {
    const { title } = await request.json()
    if (!title) {
      return NextResponse.json({ error: 'Titlul este obligatoriu' }, { status: 400 })
    }

    // Create video entry on Bunny Stream
    const { videoId } = await createStreamVideo(title)

    // Generate TUS auth signature for direct browser upload
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID!
    const apiKey = process.env.BUNNY_STREAM_API_KEY!
    const expirationTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour

    const signature = crypto
      .createHash('sha256')
      .update(`${libraryId}${apiKey}${expirationTime}${videoId}`)
      .digest('hex')

    return NextResponse.json({
      videoId,
      libraryId,
      tusEndpoint: 'https://video.bunnycdn.com/tusupload',
      authSignature: signature,
      authExpire: expirationTime,
    })
  } catch (err) {
    console.error('Video create error:', err)
    return NextResponse.json({ error: 'Eroare la crearea video' }, { status: 500 })
  }
}
