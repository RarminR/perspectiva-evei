import Link from 'next/link'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { CourseEditForm } from './CourseEditForm'

export const dynamic = 'force-dynamic'

export default async function CourseEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const course = await prisma.course.findUnique({ where: { id } })

  if (!course) notFound()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin/cursuri" className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">
            ← Înapoi la cursuri
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Editează curs</h1>
        </div>
        <Link
          href={`/admin/cursuri/${id}/editii`}
          className="px-4 py-2 bg-[#E91E8C] text-white rounded-lg hover:bg-[#E91E8C]/90 transition-colors text-sm font-medium"
        >
          Ediții
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <CourseEditForm course={course} />
      </div>
    </div>
  )
}
