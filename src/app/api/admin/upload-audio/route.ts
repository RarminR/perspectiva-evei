import { auth } from '@/lib/auth'
import { uploadToStorage } from '@/services/bunny'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const MAX_SIZE = 200 * 1024 * 1024 // 200MB
const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/x-m4a', 'audio/mp3']

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Niciun fișier selectat' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Doar fișiere audio sunt acceptate (MP3, M4A, WAV, OGG)' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fișierul audio nu poate depăși 200MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'mp3'
  const key = `guides/audio/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await uploadToStorage(buffer, key, file.type)

  return NextResponse.json({ key })
}
