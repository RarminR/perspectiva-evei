import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { DeviceActions } from './DeviceActions'
import { UserAdminActions } from './UserAdminActions'

export const dynamic = 'force-dynamic'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      devices: true,
      orders: { orderBy: { createdAt: 'desc' }, take: 20 },
      enrollments: { include: { edition: { include: { course: true } } } },
      guideAccess: { include: { guide: true } },
    },
  })

  if (!user) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/utilizatori"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Înapoi la utilizatori
        </Link>
      </div>

      {/* Profil */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profil</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Nume</p>
            <p className="font-medium text-gray-900">{user.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Rol</p>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                user.role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {user.role}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Înregistrat</p>
            <p className="text-gray-700">{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Dispozitive */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Dispozitive ({user.devices.length})
        </h2>
        {user.devices.length === 0 ? (
          <p className="text-gray-500 text-sm">Niciun dispozitiv înregistrat.</p>
        ) : (
          <div className="space-y-3">
            {user.devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {device.name || 'Dispozitiv necunoscut'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {device.fingerprint.slice(0, 12)}… · Înregistrat{' '}
                    {formatDate(device.createdAt)}
                  </p>
                </div>
                <DeviceActions userId={user.id} deviceId={device.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Înscrieri la cursuri */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Înscrieri la cursuri ({user.enrollments.length})
        </h2>
        {user.enrollments.length === 0 ? (
          <p className="text-gray-500 text-sm">Nicio înscriere.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="pb-3 font-medium">Curs</th>
                  <th className="pb-3 font-medium">Ediția</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Acces până la</th>
                </tr>
              </thead>
              <tbody>
                {user.enrollments.map((enr) => (
                  <tr key={enr.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-gray-900">{enr.edition.course.title}</td>
                    <td className="py-3 text-gray-600">#{enr.edition.editionNumber}</td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          enr.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {enr.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {formatDate(enr.accessExpiresAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Acces ghiduri */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Acces ghiduri ({user.guideAccess.length})
        </h2>
        {user.guideAccess.length === 0 ? (
          <p className="text-gray-500 text-sm">Niciun acces la ghiduri.</p>
        ) : (
          <div className="space-y-2">
            {user.guideAccess.map((ga) => (
              <div
                key={ga.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-gray-900">{ga.guide.title}</span>
                <span className="text-xs text-gray-500">
                  {formatDate(ga.grantedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comenzi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Comenzi recente ({user.orders.length})
        </h2>
        {user.orders.length === 0 ? (
          <p className="text-gray-500 text-sm">Nicio comandă.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Sumă</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {user.orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-gray-600 font-mono text-xs">
                      {order.id.slice(0, 8)}…
                    </td>
                    <td className="py-3 text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Acțiuni admin */}
      <UserAdminActions userId={user.id} currentRole={user.role} />
    </div>
  )
}
