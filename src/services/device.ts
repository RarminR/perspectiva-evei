import { prisma } from '@/lib/db'

const MAX_DEVICES = 2

export async function registerDevice(
  userId: string,
  fingerprint: string,
  deviceName: string
): Promise<{ success: boolean; error?: string; deviceId?: string }> {
  const existing = await prisma.device.findUnique({
    where: { userId_fingerprint: { userId, fingerprint } },
  })

  if (existing) {
    await prisma.device.update({
      where: { id: existing.id },
      data: { lastSeen: new Date() },
    })
    return { success: true, deviceId: existing.id }
  }

  const count = await prisma.device.count({ where: { userId } })
  if (count >= MAX_DEVICES) {
    return {
      success: false,
      error: `Ai atins limita de ${MAX_DEVICES} dispozitive. Șterge un dispozitiv pentru a continua.`,
    }
  }

  const device = await prisma.device.create({
    data: { userId, fingerprint, name: deviceName, lastSeen: new Date() },
  })

  return { success: true, deviceId: device.id }
}

export async function validateDevice(userId: string, fingerprint: string): Promise<boolean> {
  const device = await prisma.device.findUnique({
    where: { userId_fingerprint: { userId, fingerprint } },
  })

  if (!device) return false

  await prisma.device.update({
    where: { id: device.id },
    data: { lastSeen: new Date() },
  })

  return true
}

export async function removeDevice(
  userId: string,
  deviceId: string
): Promise<{ success: boolean; error?: string }> {
  const device = await prisma.device.findFirst({
    where: { id: deviceId, userId },
  })

  if (!device) {
    return { success: false, error: 'Dispozitivul nu a fost găsit.' }
  }

  await prisma.device.delete({ where: { id: deviceId } })
  return { success: true }
}

export async function listDevices(userId: string) {
  return prisma.device.findMany({
    where: { userId },
    orderBy: { lastSeen: 'desc' },
    select: { id: true, name: true, lastSeen: true, createdAt: true },
  })
}
