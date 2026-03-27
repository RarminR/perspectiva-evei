import { auth } from '@/lib/auth'
import { uploadToStorage } from '@/services/bunny'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const MAX_SIZE = 50 * 1024 * 1024 // 50MB

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

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Doar fișiere PDF sunt acceptate' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'PDF-ul nu poate depăși 50MB' }, { status: 400 })
  }

  const key = `guides/pdf/${randomUUID()}.pdf`
  const buffer = Buffer.from(await file.arrayBuffer())

  await uploadToStorage(buffer, key, 'application/pdf')

  return NextResponse.json({ key })
}
