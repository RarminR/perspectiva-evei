import { auth } from '@/lib/auth'
import { uploadToStorage, getCdnUrl } from '@/services/bunny'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

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

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Doar imagini sunt acceptate' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Imaginea nu poate depăși 5MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `images/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await uploadToStorage(buffer, path, file.type)
  const url = getCdnUrl(path)

  return NextResponse.json({ url })
}
