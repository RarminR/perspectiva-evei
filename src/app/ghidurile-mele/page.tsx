import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function GhidurileMelePage() {
  const session = await auth()
  if (!session?.user) redirect('/logare')

  const userId = (session.user as any).id

  const guideAccesses = await prisma.guideAccess.findMany({
    where: { userId },
    include: { guide: true },
    orderBy: { grantedAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-[#FDF2F8]">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold text-[#2D1B69]">Ghidurile mele</h1>

        {guideAccesses.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-6 text-lg text-gray-500">Nu ai achiziționat niciun ghid.</p>
            <Link
              href="/ghiduri"
              className="rounded-full bg-[#E91E8C] px-6 py-3 font-semibold text-white hover:opacity-90"
            >
              Explorează ghidurile
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {guideAccesses.map(({ guide }: any) => (
              <Link
                key={guide.id}
                href={`/ghidurile-mele/${guide.slug}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md"
              >
                {guide.coverImage && (
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={guide.coverImage}
                      alt={guide.title}
                      fill
                      className="object-cover transition group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h2 className="mb-1 text-lg font-bold text-[#2D1B69]">{guide.title}</h2>
                  {guide.description && (
                    <p className="text-sm text-gray-500">{guide.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm font-medium text-[#E91E8C]">Citește →</span>
                    {guide.audioKey && (
                      <span className="rounded-full bg-[#FDF2F8] px-2 py-0.5 text-xs text-[#2D1B69]">
                        🎧 Audiobook
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
