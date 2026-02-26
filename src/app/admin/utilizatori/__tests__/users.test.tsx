import { render, screen } from '@testing-library/react'
import { NextRequest } from 'next/server'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/admin/utilizatori'),
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    device: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    courseEnrollment: {
      create: vi.fn(),
    },
    guideAccess: {
      create: vi.fn(),
    },
  },
}))

const mockAdminSession = {
  user: { id: 'admin-1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
  expires: '2099-01-01',
}

const mockUsers = [
  {
    id: 'u1',
    name: 'Maria Ionescu',
    email: 'maria@test.com',
    role: 'USER',
    createdAt: new Date('2026-01-15'),
    _count: { devices: 2, orders: 3 },
  },
  {
    id: 'u2',
    name: 'Ion Popescu',
    email: 'ion@test.com',
    role: 'ADMIN',
    createdAt: new Date('2026-01-10'),
    _count: { devices: 1, orders: 0 },
  },
]

const mockUserDetail = {
  id: 'u1',
  name: 'Maria Ionescu',
  email: 'maria@test.com',
  role: 'USER',
  phone: null,
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-02-01'),
  devices: [
    { id: 'd1', fingerprint: 'abc123def456', name: 'iPhone 15', lastSeen: new Date(), createdAt: new Date('2026-01-20') },
    { id: 'd2', fingerprint: 'xyz789ghi012', name: 'MacBook Pro', lastSeen: new Date(), createdAt: new Date('2026-01-25') },
  ],
  orders: [
    { id: 'ord-1', totalAmount: 99.0, status: 'COMPLETED', currency: 'EUR', createdAt: new Date('2026-02-01') },
  ],
  enrollments: [
    {
      id: 'enr-1',
      accessExpiresAt: new Date('2026-06-01'),
      status: 'ACTIVE',
      createdAt: new Date('2026-02-01'),
      edition: { id: 'ed-1', editionNumber: 1, course: { id: 'c1', title: 'Curs Test' } },
    },
  ],
  guideAccess: [
    { id: 'ga-1', grantedAt: new Date('2026-02-01'), guide: { id: 'g1', title: 'Ghid Test' } },
  ],
}

// ─── Users List Page ────────────────────────────────────────

describe('Users List Page (/admin/utilizatori)', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)
  })

  it('renders table with user data', async () => {
    const UsersPage = (await import('../page')).default
    const jsx = await UsersPage({ searchParams: Promise.resolve({}) })
    render(jsx)
    expect(screen.getByText('Maria Ionescu')).toBeInTheDocument()
    expect(screen.getByText('Ion Popescu')).toBeInTheDocument()
    expect(screen.getByText('maria@test.com')).toBeInTheDocument()
  })

  it('renders page title "Utilizatori"', async () => {
    const UsersPage = (await import('../page')).default
    const jsx = await UsersPage({ searchParams: Promise.resolve({}) })
    render(jsx)
    expect(screen.getByText('Utilizatori')).toBeInTheDocument()
  })

  it('has search input', async () => {
    const UsersPage = (await import('../page')).default
    const jsx = await UsersPage({ searchParams: Promise.resolve({}) })
    render(jsx)
    expect(screen.getByPlaceholderText(/caut/i)).toBeInTheDocument()
  })

  it('has view links for each user', async () => {
    const UsersPage = (await import('../page')).default
    const jsx = await UsersPage({ searchParams: Promise.resolve({}) })
    render(jsx)
    const links = screen.getAllByRole('link', { name: /vezi/i })
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', '/admin/utilizatori/u1')
  })

  it('passes search param to prisma query', async () => {
    const { prisma } = await import('@/lib/db')
    const UsersPage = (await import('../page')).default
    await UsersPage({ searchParams: Promise.resolve({ search: 'maria' }) })
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: expect.objectContaining({ contains: 'maria' }) }),
          ]),
        }),
      })
    )
  })
})

// ─── User Detail Page ───────────────────────────────────────

describe('User Detail Page (/admin/utilizatori/[id])', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserDetail as any)
  })

  it('renders user profile section', async () => {
    const UserDetailPage = (await import('../[id]/page')).default
    const jsx = await UserDetailPage({ params: Promise.resolve({ id: 'u1' }) })
    render(jsx)
    expect(screen.getByText('Maria Ionescu')).toBeInTheDocument()
    expect(screen.getByText('maria@test.com')).toBeInTheDocument()
  })

  it('renders devices section with device names', async () => {
    const UserDetailPage = (await import('../[id]/page')).default
    const jsx = await UserDetailPage({ params: Promise.resolve({ id: 'u1' }) })
    render(jsx)
    expect(screen.getByText('iPhone 15')).toBeInTheDocument()
    expect(screen.getByText('MacBook Pro')).toBeInTheDocument()
  })

  it('renders remove buttons for devices', async () => {
    const UserDetailPage = (await import('../[id]/page')).default
    const jsx = await UserDetailPage({ params: Promise.resolve({ id: 'u1' }) })
    render(jsx)
    const removeButtons = screen.getAllByRole('button', { name: /elimină/i })
    expect(removeButtons).toHaveLength(2)
  })

  it('renders enrollments section', async () => {
    const UserDetailPage = (await import('../[id]/page')).default
    const jsx = await UserDetailPage({ params: Promise.resolve({ id: 'u1' }) })
    render(jsx)
    expect(screen.getByText('Curs Test')).toBeInTheDocument()
  })

  it('renders guide access section', async () => {
    const UserDetailPage = (await import('../[id]/page')).default
    const jsx = await UserDetailPage({ params: Promise.resolve({ id: 'u1' }) })
    render(jsx)
    expect(screen.getByText('Ghid Test')).toBeInTheDocument()
  })

  it('renders orders section', async () => {
    const UserDetailPage = (await import('../[id]/page')).default
    const jsx = await UserDetailPage({ params: Promise.resolve({ id: 'u1' }) })
    render(jsx)
    expect(screen.getByText('COMPLETED')).toBeInTheDocument()
  })
})

// ─── API: GET /api/admin/users ──────────────────────────────

describe('API: GET /api/admin/users', () => {
  beforeEach(async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue(mockAdminSession as any)
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)
  })

  it('returns users list', async () => {
    const { GET } = await import('@/app/api/admin/users/route')
    const req = new NextRequest('http://localhost/api/admin/users')
    const res = await GET(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.users).toHaveLength(2)
  })

  it('filters by search query', async () => {
    const { prisma } = await import('@/lib/db')
    const { GET } = await import('@/app/api/admin/users/route')
    const req = new NextRequest('http://localhost/api/admin/users?search=maria')
    await GET(req)
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      })
    )
  })

  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue(null as any)
    const { GET } = await import('@/app/api/admin/users/route')
    const req = new NextRequest('http://localhost/api/admin/users')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when not admin', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', role: 'USER' },
      expires: '2099-01-01',
    } as any)
    const { GET } = await import('@/app/api/admin/users/route')
    const req = new NextRequest('http://localhost/api/admin/users')
    const res = await GET(req)
    expect(res.status).toBe(403)
  })
})

// ─── API: DELETE /api/admin/users/[id]/devices ──────────────

describe('API: DELETE /api/admin/users/[id]/devices', () => {
  beforeEach(async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue(mockAdminSession as any)
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.device.delete).mockResolvedValue({} as any)
  })

  it('removes a device', async () => {
    const { prisma } = await import('@/lib/db')
    const { DELETE } = await import('@/app/api/admin/users/[id]/devices/route')
    const req = new NextRequest('http://localhost/api/admin/users/u1/devices', {
      method: 'DELETE',
      body: JSON.stringify({ deviceId: 'd1' }),
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'u1' }) })
    expect(res.status).toBe(200)
    expect(prisma.device.delete).toHaveBeenCalledWith({
      where: { id: 'd1', userId: 'u1' },
    })
  })

  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue(null as any)
    const { DELETE } = await import('@/app/api/admin/users/[id]/devices/route')
    const req = new NextRequest('http://localhost/api/admin/users/u1/devices', {
      method: 'DELETE',
      body: JSON.stringify({ deviceId: 'd1' }),
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'u1' }) })
    expect(res.status).toBe(401)
  })
})

// ─── API: POST /api/admin/users/[id]/access ─────────────────

describe('API: POST /api/admin/users/[id]/access', () => {
  beforeEach(async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue(mockAdminSession as any)
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.courseEnrollment.create).mockResolvedValue({ id: 'enr-new' } as any)
    vi.mocked(prisma.guideAccess.create).mockResolvedValue({ id: 'ga-new' } as any)
  })

  it('grants course access', async () => {
    const { prisma } = await import('@/lib/db')
    const { POST } = await import('@/app/api/admin/users/[id]/access/route')
    const req = new NextRequest('http://localhost/api/admin/users/u1/access', {
      method: 'POST',
      body: JSON.stringify({ type: 'course', resourceId: 'ed-1', expiresAt: '2026-12-31' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'u1' }) })
    expect(res.status).toBe(201)
    expect(prisma.courseEnrollment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u1',
        editionId: 'ed-1',
      }),
    })
  })

  it('grants guide access', async () => {
    const { prisma } = await import('@/lib/db')
    const { POST } = await import('@/app/api/admin/users/[id]/access/route')
    const req = new NextRequest('http://localhost/api/admin/users/u1/access', {
      method: 'POST',
      body: JSON.stringify({ type: 'guide', resourceId: 'g1' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'u1' }) })
    expect(res.status).toBe(201)
    expect(prisma.guideAccess.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u1',
        guideId: 'g1',
      }),
    })
  })

  it('returns 400 for invalid type', async () => {
    const { POST } = await import('@/app/api/admin/users/[id]/access/route')
    const req = new NextRequest('http://localhost/api/admin/users/u1/access', {
      method: 'POST',
      body: JSON.stringify({ type: 'invalid', resourceId: 'x' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'u1' }) })
    expect(res.status).toBe(400)
  })
})
