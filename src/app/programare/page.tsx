import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SchedulingClient from './SchedulingClient'

export const dynamic = 'force-dynamic'

export default async function ProgramarePage() {
  const session = await auth()
  if (!session?.user) redirect('/logare')

  return (
    <div className="min-h-screen bg-[#FDF2F8]">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-4 text-3xl font-bold text-[#2D1B69]">
          Programează o ședință 1:1
        </h1>
        <p className="mb-8 text-gray-600">
          Ședința durează 60 de minute și se desfășoară online via Zoom.
          Vei primi un link de Zoom după confirmare.
        </p>
        <SchedulingClient />
      </div>
    </div>
  )
}
