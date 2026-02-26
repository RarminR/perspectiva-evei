import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProfileForm } from './components/ProfileForm'
import { DeviceList } from './components/DeviceList'

export const dynamic = 'force-dynamic'

export default async function ProfilulMeuPage() {
  const session = await auth()
  if (!session?.user) redirect('/logare')

  const userId = (session.user as any).id

  const [user, devices, enrollments, guideAccesses, orders] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.device.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.courseEnrollment.findMany({
      where: { userId },
      include: { edition: { include: { course: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.guideAccess.findMany({
      where: { userId },
      include: { guide: true },
      orderBy: { grantedAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  if (!user) redirect('/logare')

  return (
    <div className="min-h-screen bg-[#FDF2F8]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-[#2D1B69] mb-8">Profilul meu</h1>

        {/* Profile section */}
        <section className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#2D1B69] mb-4">Informatii personale</h2>
          <ProfileForm
            user={{
              id: user.id,
              name: user.name ?? '',
              email: user.email,
              phone: user.phone ?? '',
            }}
          />
        </section>

        {/* Devices section */}
        <section className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#2D1B69] mb-4">Dispozitivele mele</h2>
          <DeviceList devices={devices} />
        </section>

        {/* Course enrollments */}
        <section className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#2D1B69] mb-4">Cursurile mele</h2>
          {enrollments.length === 0 ? (
            <p className="text-gray-500">Nu esti inscris la niciun curs.</p>
          ) : (
            <ul className="space-y-3">
              {enrollments.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between p-3 bg-[#FDF2F8] rounded-lg"
                >
                  <div>
                    <p className="font-medium text-[#2D1B69]">
                      {e.edition.course.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      Editia {e.edition.editionNumber} · Acces pana la{' '}
                      {new Date(e.accessExpiresAt).toLocaleDateString('ro-RO')}
                    </p>
                  </div>
                  <a
                    href={`/curs/${e.edition.course.slug}`}
                    className="text-[#E91E8C] font-medium text-sm hover:underline"
                  >
                    Acceseaza →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Guide accesses */}
        <section className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#2D1B69] mb-4">Ghidurile mele</h2>
          {guideAccesses.length === 0 ? (
            <p className="text-gray-500">Nu ai achizitionat niciun ghid.</p>
          ) : (
            <ul className="space-y-3">
              {guideAccesses.map((ga) => (
                <li
                  key={ga.id}
                  className="flex items-center justify-between p-3 bg-[#FDF2F8] rounded-lg"
                >
                  <p className="font-medium text-[#2D1B69]">{ga.guide.title}</p>
                  <a
                    href={`/ghidurile-mele/${ga.guide.slug}`}
                    className="text-[#E91E8C] font-medium text-sm hover:underline"
                  >
                    Citeste →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Order history */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#2D1B69] mb-4">Istoricul comenzilor</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500">Nu ai nicio comanda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Data</th>
                    <th className="pb-2 font-medium">Suma</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-2 text-gray-700">
                        {new Date(o.createdAt).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="py-2 text-gray-900 font-medium">
                        &euro;{o.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            o.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
