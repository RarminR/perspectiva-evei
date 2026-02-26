import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { getGuideContent } from '@/services/guide'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id
  const guide = await getGuideContent(params.id, userId)

  if (!guide) {
    return NextResponse.json({ error: 'Nu ai acces la acest ghid.' }, { status: 403 })
  }

  return NextResponse.json({ guide })
}
