import Link from 'next/link'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { AddStudentForm } from './AddStudentForm'

export const dynamic = 'force-dynamic'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default async function EnrolledStudentsPage({
  params,
}: {
  params: Promise<{ id: string; editionId: string }>
}) {
  const { id, editionId } = await params

  const edition = await prisma.courseEdition.findUnique({
    where: { id: editionId },
    select: { id: true, courseId: true, editionNumber: true },
  })

  if (!edition) notFound()

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { editionId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const enrolledUserIds = enrollments.map((e) => e.user.id)

  const availableUsers = await prisma.user.findMany({
    where: { id: { notIn: enrolledUserIds }, role: 'USER' },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/admin/cursuri/${id}/editii/${editionId}`}
          className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block"
        >
          ← Editia {edition.editionNumber}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Cursanti inscrisi</h1>
      </div>

      <AddStudentForm editionId={editionId} users={availableUsers} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-4 font-medium">Nume</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Inscris la</th>
                <th className="px-6 py-4 font-medium">Acces pana la</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-6 py-4 font-medium text-gray-900">{enrollment.user.name}</td>
                  <td className="px-6 py-4 text-gray-500">{enrollment.user.email}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(enrollment.createdAt)}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(enrollment.accessExpiresAt)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        enrollment.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : enrollment.status === 'EXPIRED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {enrollment.status}
                    </span>
                  </td>
                </tr>
              ))}
              {enrollments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Niciun cursant inscris.
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
