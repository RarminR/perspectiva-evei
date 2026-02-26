import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    device: { findMany: vi.fn() },
    courseEnrollment: { findMany: vi.fn() },
    guideAccess: { findMany: vi.fn() },
    order: { findMany: vi.fn() },
  },
}))

// Mock device service
vi.mock('@/services/device', () => ({
  removeDevice: vi.fn(),
}))

// Mock fetch for client components
const mockFetch = vi.fn()
global.fetch = mockFetch

// ─── Fixtures ──────────────────────────────────────────────

const mockUser = {
  id: 'user-1',
  email: 'maria@test.com',
  name: 'Maria Ionescu',
  phone: '0721123456',
  role: 'USER',
  hashedPassword: 'hashed',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-15'),
}

const mockDevices = [
  {
    id: 'dev-1',
    userId: 'user-1',
    fingerprint: 'abc12345xyz',
    name: 'Chrome pe Windows',
    lastSeen: new Date('2026-02-20'),
    createdAt: new Date('2026-01-10'),
  },
  {
    id: 'dev-2',
    userId: 'user-1',
    fingerprint: 'def67890uvw',
    name: 'Safari pe iPhone',
    lastSeen: new Date('2026-02-19'),
    createdAt: new Date('2026-01-12'),
  },
]

const mockEnrollments = [
  {
    id: 'enr-1',
    userId: 'user-1',
    editionId: 'ed-1',
    status: 'ACTIVE',
    accessExpiresAt: new Date('2026-06-01'),
    createdAt: new Date('2026-02-01'),
    edition: {
      id: 'ed-1',
      courseId: 'c-1',
      editionNumber: 3,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-04-01'),
      enrollmentOpen: true,
      maxParticipants: 15,
      createdAt: new Date(),
      course: {
        id: 'c-1',
        title: 'Arta Manifestarii Constiente',
        slug: 'arta-manifestarii-constiente',
        description: null,
        price: 297,
        installmentPrice: null,
        maxParticipants: 15,
        accessDurationDays: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  },
]

const mockGuideAccesses = [
  {
    id: 'ga-1',
    userId: 'user-1',
    guideId: 'g-1',
    orderId: 'ord-1',
    grantedAt: new Date('2026-01-20'),
    guide: {
      id: 'g-1',
      title: 'Ghidul Abundentei',
      slug: 'ghidul-abundentei',
      description: null,
      price: 47,
      coverImage: null,
      contentJson: null,
      audioKey: null,
      audioDuration: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
]

const mockOrders = [
  {
    id: 'ord-1',
    userId: 'user-1',
    revolutOrderId: 'rev-1',
    revolutCheckoutUrl: null,
    status: 'COMPLETED',
    totalAmount: 297.0,
    currency: 'EUR',
    installmentNumber: null,
    parentOrderId: null,
    expiresPendingAfter: null,
    shippingAddress: null,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date(),
  },
]

const mockSession = {
  user: { id: 'user-1', name: 'Maria Ionescu', email: 'maria@test.com', role: 'USER' },
  expires: '2099-01-01',
}

// ─── Helper: setup prisma mocks ────────────────────────────

async function setupPrismaMocks() {
  const { prisma } = await import('@/lib/db')
  vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
  vi.mocked(prisma.device.findMany).mockResolvedValue(mockDevices as any)
  vi.mocked(prisma.courseEnrollment.findMany).mockResolvedValue(mockEnrollments as any)
  vi.mocked(prisma.guideAccess.findMany).mockResolvedValue(mockGuideAccesses as any)
  vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)
}

async function setupAuthMock() {
  const { auth } = await import('@/lib/auth')
  vi.mocked(auth).mockResolvedValue(mockSession as any)
}

// ─── Profile Page (Server Component) ───────────────────────

describe('ProfilulMeuPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await setupAuthMock()
    await setupPrismaMocks()
  })

  it('renders page heading', async () => {
    const Page = (await import('../page')).default
    const jsx = await Page()
    render(jsx)
    expect(screen.getByText('Profilul meu')).toBeInTheDocument()
  })

  it('renders "Dispozitivele mele" section', async () => {
    const Page = (await import('../page')).default
    const jsx = await Page()
    render(jsx)
    expect(screen.getByText('Dispozitivele mele')).toBeInTheDocument()
  })

  it('renders "Cursurile mele" section', async () => {
    const Page = (await import('../page')).default
    const jsx = await Page()
    render(jsx)
    expect(screen.getByText('Cursurile mele')).toBeInTheDocument()
  })

  it('renders "Ghidurile mele" section', async () => {
    const Page = (await import('../page')).default
    const jsx = await Page()
    render(jsx)
    expect(screen.getByText('Ghidurile mele')).toBeInTheDocument()
  })

  it('renders "Istoricul comenzilor" section', async () => {
    const Page = (await import('../page')).default
    const jsx = await Page()
    render(jsx)
    expect(screen.getByText('Istoricul comenzilor')).toBeInTheDocument()
  })

  it('renders course enrollment data', async () => {
    const Page = (await import('../page')).default
    const jsx = await Page()
    render(jsx)
    expect(screen.getByText('Arta Manifestarii Constiente')).toBeInTheDocument()
  })

  it('renders guide access data', async () => {
    const Page = (await import('../page')).default
    const jsx = await Page()
    render(jsx)
    expect(screen.getByText('Ghidul Abundentei')).toBeInTheDocument()
  })

  it('renders order status', async () => {
    const Page = (await import('../page')).default
    const jsx = await Page()
    render(jsx)
    expect(screen.getByText('COMPLETED')).toBeInTheDocument()
  })

  it('redirects to /logare when not authenticated', async () => {
    const { auth } = await import('@/lib/auth')
    const { redirect } = await import('next/navigation')
    vi.mocked(auth).mockResolvedValue(null as any)

    const Page = (await import('../page')).default
    try { await Page() } catch { /* redirect throws */ }
    expect(redirect).toHaveBeenCalledWith('/logare')
  })

  it('shows empty state when no courses enrolled', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.courseEnrollment.findMany).mockResolvedValue([])

    const Page = (await import('../page')).default
    const jsx = await Page()
    render(jsx)
    expect(screen.getByText('Nu esti inscris la niciun curs.')).toBeInTheDocument()
  })

  it('shows empty state when no guides', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.guideAccess.findMany).mockResolvedValue([])

    const Page = (await import('../page')).default
    const jsx = await Page()
    render(jsx)
    expect(screen.getByText('Nu ai achizitionat niciun ghid.')).toBeInTheDocument()
  })

  it('shows empty state when no orders', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.order.findMany).mockResolvedValue([])

    const Page = (await import('../page')).default
    const jsx = await Page()
    render(jsx)
    expect(screen.getByText('Nu ai nicio comanda.')).toBeInTheDocument()
  })
})

// ─── ProfileForm (Client Component) ────────────────────────

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('renders with name and phone fields', async () => {
    const { ProfileForm } = await import('../components/ProfileForm')
    render(
      <ProfileForm user={{ id: 'user-1', name: 'Maria Ionescu', email: 'maria@test.com', phone: '0721123456' }} />
    )
    expect(screen.getByDisplayValue('Maria Ionescu')).toBeInTheDocument()
    expect(screen.getByDisplayValue('0721123456')).toBeInTheDocument()
  })

  it('renders email as read-only', async () => {
    const { ProfileForm } = await import('../components/ProfileForm')
    render(
      <ProfileForm user={{ id: 'user-1', name: 'Maria', email: 'maria@test.com', phone: '' }} />
    )
    const emailInput = screen.getByDisplayValue('maria@test.com')
    expect(emailInput).toHaveAttribute('readOnly')
  })

  it('submits profile update on save', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Maria Updated', phone: '0721999999' }),
    })

    const { ProfileForm } = await import('../components/ProfileForm')
    render(
      <ProfileForm user={{ id: 'user-1', name: 'Maria', email: 'maria@test.com', phone: '' }} />
    )

    fireEvent.change(screen.getByLabelText(/Nume/i), { target: { value: 'Maria Updated' } })
    fireEvent.change(screen.getByLabelText(/Telefon/i), { target: { value: '0721999999' } })
    fireEvent.click(screen.getByRole('button', { name: /Salveaza/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/profile', expect.objectContaining({
        method: 'PUT',
      }))
    })
  })

  it('renders password change section', async () => {
    const { ProfileForm } = await import('../components/ProfileForm')
    render(
      <ProfileForm user={{ id: 'user-1', name: 'Maria', email: 'maria@test.com', phone: '' }} />
    )
    expect(screen.getByRole('heading', { name: /Schimba parola/i })).toBeInTheDocument()
  })
})

// ─── DeviceList (Client Component) ─────────────────────────

describe('DeviceList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('renders device items', async () => {
    const { DeviceList } = await import('../components/DeviceList')
    render(<DeviceList devices={mockDevices as any} />)
    expect(screen.getByText('Chrome pe Windows')).toBeInTheDocument()
    expect(screen.getByText('Safari pe iPhone')).toBeInTheDocument()
  })

  it('renders remove button for each device', async () => {
    const { DeviceList } = await import('../components/DeviceList')
    render(<DeviceList devices={mockDevices as any} />)
    const buttons = screen.getAllByRole('button', { name: /Elimina/i })
    expect(buttons).toHaveLength(2)
  })

  it('calls delete API on remove click', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })

    const { DeviceList } = await import('../components/DeviceList')
    render(<DeviceList devices={mockDevices as any} />)

    const buttons = screen.getAllByRole('button', { name: /Elimina/i })
    fireEvent.click(buttons[0])

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/devices', expect.objectContaining({
        method: 'DELETE',
      }))
    })
  })

  it('removes device from list after successful delete', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })

    const { DeviceList } = await import('../components/DeviceList')
    render(<DeviceList devices={mockDevices as any} />)

    const buttons = screen.getAllByRole('button', { name: /Elimina/i })
    fireEvent.click(buttons[0])

    await waitFor(() => {
      expect(screen.queryByText('Chrome pe Windows')).not.toBeInTheDocument()
    })
  })

  it('shows empty state when no devices', async () => {
    const { DeviceList } = await import('../components/DeviceList')
    render(<DeviceList devices={[]} />)
    expect(screen.getByText(/niciun dispozitiv/i)).toBeInTheDocument()
  })
})

// ─── API: GET /api/user/profile ────────────────────────────

describe('API: GET /api/user/profile', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await setupAuthMock()
  })

  it('returns user data for authenticated user', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

    const { GET } = await import('../../api/user/profile/route')
    const response = await GET()
    const data = await response.json()

    expect(data.email).toBe('maria@test.com')
    expect(data.name).toBe('Maria Ionescu')
    expect(data.phone).toBe('0721123456')
  })

  it('returns 401 for unauthenticated request', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue(null as any)

    const { GET } = await import('../../api/user/profile/route')
    const response = await GET()
    expect(response.status).toBe(401)
  })
})

// ─── API: PUT /api/user/profile ────────────────────────────

describe('API: PUT /api/user/profile', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await setupAuthMock()
  })

  it('updates name and phone', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockUser,
      name: 'Maria Updated',
      phone: '0721999999',
    } as any)

    const { PUT } = await import('../../api/user/profile/route')
    const request = new Request('http://localhost/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Maria Updated', phone: '0721999999' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PUT(request as any)
    const data = await response.json()

    expect(data.name).toBe('Maria Updated')
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'Maria Updated', phone: '0721999999' },
    })
  })
})

// ─── API: DELETE /api/user/devices ─────────────────────────

describe('API: DELETE /api/user/devices', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await setupAuthMock()
  })

  it('removes device belonging to user', async () => {
    const { removeDevice } = await import('@/services/device')
    vi.mocked(removeDevice).mockResolvedValue({ success: true })

    const { DELETE } = await import('../../api/user/devices/route')
    const request = new Request('http://localhost/api/user/devices', {
      method: 'DELETE',
      body: JSON.stringify({ deviceId: 'dev-1' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await DELETE(request as any)
    expect(response.status).toBe(200)
  })
})
