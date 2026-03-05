import Link from 'next/link'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { EditionEditForm } from './EditionEditForm'

export const dynamic = 'force-dynamic'

export default async function EditionEditPage({
  params,
}: {
  params: Promise<{ id: string; editionId: string }>
}) {
  const { id, editionId } = await params

  const edition = await prisma.courseEdition.findUnique({
    where: { id: editionId },
    include: { course: { select: { id: true, title: true } } },
  })

  if (!edition) notFound()

  return (
    <div>
      <div className="mb-8">
        <Link href={`/admin/cursuri/${id}/editii`} className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">
          ← Înapoi la ediții
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Editează Ediția {edition.editionNumber}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
        <EditionEditForm edition={edition} courseId={id} />
      </div>

      <div className="mt-6 flex gap-4">
        <Link
          href={`/admin/cursuri/${id}/editii/${editionId}/lectii`}
          className="px-4 py-2 bg-[#a007dc] text-white rounded-lg hover:bg-[#a007dc]/90 transition-colors text-sm font-medium"
        >
          Lecții
        </Link>
        <Link
          href={`/admin/cursuri/${id}/editii/${editionId}/cursanti`}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Cursanți
        </Link>
      </div>
    </div>
  )
}
