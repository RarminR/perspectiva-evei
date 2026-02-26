import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
  },
}))

import { POST } from './route'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

const mockPrisma = vi.mocked(prisma)
const mockBcrypt = vi.mocked(bcrypt)

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates user with hashed password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 'cuid123',
      email: 'test@example.com',
      name: 'Test User',
      hashedPassword: '$2a$12$hashedpassword',
      phone: null,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const req = createRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'securepass123',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toEqual({ id: 'cuid123', email: 'test@example.com' })
    expect(mockBcrypt.hash).toHaveBeenCalledWith('securepass123', 12)
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        hashedPassword: '$2a$12$hashedpassword',
      },
    })
  })

  it('rejects duplicate email with 409', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-user',
      email: 'test@example.com',
      name: 'Existing',
      hashedPassword: '$2a$12$hashed',
      phone: null,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const req = createRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'securepass123',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('Email-ul este deja folosit')
  })

  it('validates required fields — missing name', async () => {
    const req = createRequest({ email: 'test@example.com', password: 'pass123' })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Toate câmpurile sunt obligatorii')
  })

  it('validates required fields — missing email', async () => {
    const req = createRequest({ name: 'Test', password: 'pass123' })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Toate câmpurile sunt obligatorii')
  })

  it('validates required fields — missing password', async () => {
    const req = createRequest({ name: 'Test', email: 'test@example.com' })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Toate câmpurile sunt obligatorii')
  })
})
