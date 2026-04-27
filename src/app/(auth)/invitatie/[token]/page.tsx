import Link from 'next/link'
import { prisma } from '@/lib/db'
import { InviteForm } from './InviteForm'

export const dynamic = 'force-dynamic'

export default async function InvitatiePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const user = await prisma.user.findUnique({
    where: { inviteToken: token },
    select: { email: true, name: true, inviteTokenExpiresAt: true },
  })

  const isValid =
    !!user &&
    !!user.inviteTokenExpiresAt &&
    user.inviteTokenExpiresAt.getTime() > Date.now()

  if (!isValid) {
    return (
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.1] rounded-3xl p-8 sm:p-10 shadow-2xl shadow-purple-950/40 text-center">
        <div className="w-16 h-1 bg-gradient-to-r from-[#a007dc] to-[#d063f0] rounded-full mx-auto mb-8" />
        <h1 className="text-[#f8f9fa] text-2xl font-bold mb-3">
          Invitație invalidă
        </h1>
        <p className="text-[#f8f9fa]/60 text-sm mb-6">
          Linkul de invitație este invalid sau a expirat. Contactează administratorul
          pentru un link nou.
        </p>
        <Link
          href="/logare"
          className="text-[#f8f9fa]/80 underline hover:text-[#f8f9fa] transition-colors text-sm"
        >
          Înapoi la logare
        </Link>
      </div>
    )
  }

  return (
    <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.1] rounded-3xl p-8 sm:p-10 shadow-2xl shadow-purple-950/40">
      <div className="w-16 h-1 bg-gradient-to-r from-[#a007dc] to-[#d063f0] rounded-full mx-auto mb-8" />

      <p className="text-center text-[#f8f9fa]/40 text-xs font-semibold tracking-[0.2em] uppercase mb-6">
        Perspectiva Evei
      </p>

      <h1 className="text-[#f8f9fa] text-2xl font-bold text-center mb-2">
        Bun venit{user!.name ? `, ${user!.name}` : ''}!
      </h1>
      <p className="text-[#f8f9fa]/60 text-sm text-center mb-8">
        Setează-ți o parolă pentru contul {user!.email}.
      </p>

      <InviteForm token={token} email={user!.email} />
    </div>
  )
}
