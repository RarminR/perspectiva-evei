import Link from 'next/link'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {},
    include: { _count: { select: { devices: true, orders: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Utilizatori</h1>
        <Link
          href="/admin/utilizatori/new"
          className="px-4 py-2 bg-[#a007dc] text-white rounded-lg text-sm font-medium hover:bg-[#51087e] transition"
        >
          Adaugă utilizator
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="mb-6">
        <input
          type="text"
          name="search"
          defaultValue={search ?? ''}
          placeholder="Caută după nume sau email..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51087e] focus:border-transparent"
        />
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {users.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">Niciun utilizator găsit.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50">
                  <th className="px-6 py-3 font-medium">Nume</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Rol</th>
                  <th className="px-6 py-3 font-medium">Dispozitive</th>
                  <th className="px-6 py-3 font-medium">Comenzi</th>
                  <th className="px-6 py-3 font-medium">Înregistrat</th>
                  <th className="px-6 py-3 font-medium">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {user._count.devices}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {user._count.orders}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/utilizatori/${user.id}`}
                        className="text-[#51087e] hover:text-[#a007dc] font-medium text-sm"
                      >
                        Vezi
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
