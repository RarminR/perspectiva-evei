import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    device: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db', () => ({ prisma: mockPrisma }))

import { listDevices, registerDevice, removeDevice, validateDevice } from './device'

describe('Device service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registerDevice creates a new device and returns deviceId', async () => {
    mockPrisma.device.findUnique.mockResolvedValueOnce(null)
    mockPrisma.device.count.mockResolvedValueOnce(1)
    mockPrisma.device.create.mockResolvedValueOnce({ id: 'device-1' })

    const result = await registerDevice('user-1', 'fp-1', 'Laptop')

    expect(result).toEqual({ success: true, deviceId: 'device-1' })
    expect(mockPrisma.device.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        fingerprint: 'fp-1',
        name: 'Laptop',
        lastSeen: expect.any(Date),
      },
    })
  })

  it('registerDevice returns existing device and updates lastSeen on duplicate fingerprint', async () => {
    mockPrisma.device.findUnique.mockResolvedValueOnce({ id: 'device-existing' })
    mockPrisma.device.update.mockResolvedValueOnce({ id: 'device-existing' })

    const result = await registerDevice('user-1', 'fp-1', 'Laptop')

    expect(result).toEqual({ success: true, deviceId: 'device-existing' })
    expect(mockPrisma.device.update).toHaveBeenCalledWith({
      where: { id: 'device-existing' },
      data: { lastSeen: expect.any(Date) },
    })
    expect(mockPrisma.device.count).not.toHaveBeenCalled()
    expect(mockPrisma.device.create).not.toHaveBeenCalled()
  })

  it('registerDevice rejects 3rd device with Romanian limit error', async () => {
    mockPrisma.device.findUnique.mockResolvedValueOnce(null)
    mockPrisma.device.count.mockResolvedValueOnce(2)

    const result = await registerDevice('user-1', 'fp-3', 'Tablet')

    expect(result.success).toBe(false)
    expect(result.error).toBe(
      'Ai atins limita de 2 dispozitive. Șterge un dispozitiv pentru a continua.'
    )
    expect(mockPrisma.device.create).not.toHaveBeenCalled()
  })

  it('validateDevice returns true for registered device and updates lastSeen', async () => {
    mockPrisma.device.findUnique.mockResolvedValueOnce({ id: 'device-1' })
    mockPrisma.device.update.mockResolvedValueOnce({ id: 'device-1' })

    const result = await validateDevice('user-1', 'fp-1')

    expect(result).toBe(true)
    expect(mockPrisma.device.update).toHaveBeenCalledWith({
      where: { id: 'device-1' },
      data: { lastSeen: expect.any(Date) },
    })
  })

  it('validateDevice returns false for unknown fingerprint', async () => {
    mockPrisma.device.findUnique.mockResolvedValueOnce(null)

    const result = await validateDevice('user-1', 'fp-unknown')

    expect(result).toBe(false)
    expect(mockPrisma.device.update).not.toHaveBeenCalled()
  })

  it('removeDevice deletes owned device and returns success', async () => {
    mockPrisma.device.findFirst.mockResolvedValueOnce({ id: 'device-1', userId: 'user-1' })
    mockPrisma.device.delete.mockResolvedValueOnce({ id: 'device-1' })

    const result = await removeDevice('user-1', 'device-1')

    expect(result).toEqual({ success: true })
    expect(mockPrisma.device.delete).toHaveBeenCalledWith({ where: { id: 'device-1' } })
  })

  it('removeDevice returns error when device does not belong to user', async () => {
    mockPrisma.device.findFirst.mockResolvedValueOnce(null)

    const result = await removeDevice('user-2', 'device-1')

    expect(result).toEqual({ success: false, error: 'Dispozitivul nu a fost găsit.' })
    expect(mockPrisma.device.delete).not.toHaveBeenCalled()
  })

  it('listDevices returns devices ordered by lastSeen desc', async () => {
    const devices = [
      { id: 'device-2', name: 'Laptop', lastSeen: new Date(), createdAt: new Date() },
      { id: 'device-1', name: 'Phone', lastSeen: new Date(), createdAt: new Date() },
    ]
    mockPrisma.device.findMany.mockResolvedValueOnce(devices)

    const result = await listDevices('user-1')

    expect(result).toEqual(devices)
    expect(mockPrisma.device.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { lastSeen: 'desc' },
      select: { id: true, name: true, lastSeen: true, createdAt: true },
    })
  })
})
