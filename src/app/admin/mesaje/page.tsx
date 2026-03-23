import { prisma } from '@/lib/db'
import { AdminMessagesClient } from './AdminMessagesClient'

export const dynamic = 'force-dynamic'

export default async function AdminMessagesPage() {
  const conversations = await prisma.user.findMany({
    where: { messages: { some: {} } },
    select: {
      id: true,
      name: true,
      email: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, fromAdmin: true, createdAt: true, read: true },
      },
      _count: { select: { messages: { where: { fromAdmin: false, read: false } } } },
    },
  })

  const serialized = conversations
    .map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      lastMessage: u.messages[0]
        ? {
            content: u.messages[0].content,
            fromAdmin: u.messages[0].fromAdmin,
            createdAt: u.messages[0].createdAt.toISOString(),
            read: u.messages[0].read,
          }
        : null,
      unreadCount: u._count.messages,
    }))
    .sort((a, b) => b.unreadCount - a.unreadCount)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mesaje</h1>
      <AdminMessagesClient conversations={serialized} />
    </div>
  )
}
