import Link from 'next/link'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    include: { editions: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cursuri</h1>
        <Link
          href="/admin/cursuri/nou"
          className="px-4 py-2 bg-[#2D1B69] text-white rounded-lg hover:bg-[#2D1B69]/90 transition-colors text-sm font-medium"
        >
          Adaugă curs
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-4 font-medium">Titlu</th>
                <th className="px-6 py-4 font-medium">Slug</th>
                <th className="px-6 py-4 font-medium">Preț</th>
                <th className="px-6 py-4 font-medium">Ediții</th>
                <th className="px-6 py-4 font-medium">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-6 py-4 font-medium text-gray-900">{course.title}</td>
                  <td className="px-6 py-4 text-gray-500">{course.slug}</td>
                  <td className="px-6 py-4 text-gray-900">€{course.price}</td>
                  <td className="px-6 py-4 text-gray-500">{course.editions.length} ediții</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/cursuri/${course.id}`}
                        className="text-[#2D1B69] hover:underline font-medium"
                      >
                        Editează
                      </Link>
                      <Link
                        href={`/admin/cursuri/${course.id}/editii`}
                        className="text-[#E91E8C] hover:underline font-medium"
                      >
                        Ediții
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Niciun curs încă.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
