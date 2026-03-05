import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ExpiredPage({
  params,
}: {
  params: Promise<{ editionSlug: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/logare')

  // Await params per Next.js 15 convention (slug available for future use)
  await params

  return (
    <div className="min-h-screen bg-[#f5f0ff] flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        <div className="text-6xl mb-6">⏰</div>
        <h1 className="text-2xl font-bold text-[#51087e] mb-4">
          Accesul tău a expirat
        </h1>
        <p className="text-gray-600 mb-8">
          Perioada ta de acces la acest curs a expirat. Poți prelungi accesul
          pentru încă 30 de zile.
        </p>
        <Link
          href="/cursul-ado"
          className="inline-block bg-[#a007dc] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#a007dc]/80 transition-colors"
        >
          Prelungește accesul
        </Link>
        <div className="mt-4">
          <Link
            href="/profilul-meu"
            className="text-[#51087e] hover:underline text-sm"
          >
            Înapoi la profilul meu
          </Link>
        </div>
      </div>
    </div>
  )
}
