import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { GuideReader } from '@/components/GuideReader'
import { AudiobookPlayer } from '@/components/AudiobookPlayer'

export const dynamic = 'force-dynamic'

export default async function GuideReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/logare')

  const userId = (session.user as any).id
  const userEmail = session.user.email ?? ''
  const { slug } = await params

  const guide = await prisma.guide.findUnique({ where: { slug } })
  if (!guide) {
    return (
      <div className="p-8 text-center text-gray-500">Ghidul nu a fost găsit.</div>
    )
  }

  const access = await prisma.guideAccess.findUnique({
    where: { userId_guideId: { userId, guideId: guide.id } },
  })

  if (!access) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDF2F8]">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-[#2D1B69]">Acces interzis</h1>
          <p className="mb-6 text-gray-600">Nu ai achiziționat acest ghid.</p>
          <a
            href={`/ghiduri/${guide.slug}`}
            className="rounded-full bg-[#E91E8C] px-6 py-3 font-semibold text-white hover:opacity-90"
          >
            Cumpără ghidul
          </a>
        </div>
      </div>
    )
  }

  const audioUrl = guide.audioKey ? `/api/guides/${guide.id}/audio` : null

  return (
    <div className="min-h-screen bg-[#FDF2F8]">
      {guide.audioKey && (
        <div className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
          <div className="mx-auto max-w-4xl px-4">
            <AudiobookPlayer guideId={guide.id} audioUrl={audioUrl} />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <a href="/ghidurile-mele" className="text-sm text-[#E91E8C] hover:underline">
            ← Înapoi la ghidurile mele
          </a>
        </div>

        <GuideReader
          guide={{
            id: guide.id,
            title: guide.title,
            contentJson: guide.contentJson,
          }}
          userEmail={userEmail}
          userId={userId}
        />
      </div>
    </div>
  )
}
