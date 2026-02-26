import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminLayoutClient } from './components/AdminLayoutClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/logare')
  }

  if ((session.user as any).role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acces interzis
          </h1>
          <p className="text-gray-600">
            Nu ai permisiunea de a accesa această pagină.
          </p>
        </div>
      </div>
    )
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
