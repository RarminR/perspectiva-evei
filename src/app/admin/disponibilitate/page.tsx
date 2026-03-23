import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AvailabilityCalendar } from './AvailabilityCalendar'

export const dynamic = 'force-dynamic'

export default async function DisponibilitatePage() {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/logare')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#51087e]">Disponibilitate</h1>
        <p className="text-sm text-gray-500 mt-1">Click pe o celulă pentru a adăuga un interval</p>
      </div>
      <AvailabilityCalendar />
    </div>
  )
}
