import { render, screen } from '@testing-library/react'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/admin/cursuri'),
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
  useParams: vi.fn(() => ({})),
  redirect: vi.fn(),
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    course: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    courseEdition: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    lesson: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    courseEnrollment: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// ─── Courses List Page ─────────────────────────────────────

describe('Courses List (/admin/cursuri)', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.course.findMany).mockResolvedValue([
      {
        id: 'c1',
        title: 'Curs de bază',
        slug: 'curs-de-baza',
        description: 'Descriere curs',
        price: 299,
        installmentPrice: null,
        maxParticipants: 15,
        accessDurationDays: 30,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date(),
        editions: [
          { id: 'e1', editionNumber: 1 },
          { id: 'e2', editionNumber: 2 },
        ],
      },
      {
        id: 'c2',
        title: 'Curs avansat',
        slug: 'curs-avansat',
        description: null,
        price: 499,
        installmentPrice: null,
        maxParticipants: 10,
        accessDurationDays: 60,
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date(),
        editions: [],
      },
    ] as any)
  })

  it('renders table with course data', async () => {
    const CoursesPage = (await import('../../cursuri/page')).default
    const jsx = await CoursesPage()
    render(jsx)
    expect(screen.getByText('Curs de bază')).toBeInTheDocument()
    expect(screen.getByText('Curs avansat')).toBeInTheDocument()
  })

  it('shows number of editions for each course', async () => {
    const CoursesPage = (await import('../../cursuri/page')).default
    const jsx = await CoursesPage()
    render(jsx)
    expect(screen.getByText('2 ediții')).toBeInTheDocument()
    expect(screen.getByText('0 ediții')).toBeInTheDocument()
  })

  it('renders "Adaugă curs" button', async () => {
    const CoursesPage = (await import('../../cursuri/page')).default
    const jsx = await CoursesPage()
    render(jsx)
    expect(screen.getByText('Adaugă curs')).toBeInTheDocument()
  })

  it('renders edit links for each course', async () => {
    const CoursesPage = (await import('../../cursuri/page')).default
    const jsx = await CoursesPage()
    render(jsx)
    const editLinks = screen.getAllByRole('link', { name: /Editează/i })
    expect(editLinks).toHaveLength(2)
    expect(editLinks[0]).toHaveAttribute('href', '/admin/cursuri/c1')
  })
})

// ─── Course Edit Page ──────────────────────────────────────

describe('Course Edit (/admin/cursuri/[id])', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.course.findUnique).mockResolvedValue({
      id: 'c1',
      title: 'Curs de bază',
      slug: 'curs-de-baza',
      description: 'Descriere curs',
      price: 299,
      installmentPrice: null,
      maxParticipants: 15,
      accessDurationDays: 30,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date(),
    } as any)
  })

  it('renders form with course fields', async () => {
    const CourseEditPage = (await import('../../cursuri/[id]/page')).default
    const jsx = await CourseEditPage({ params: Promise.resolve({ id: 'c1' }) })
    render(jsx)
    expect(screen.getByDisplayValue('Curs de bază')).toBeInTheDocument()
    expect(screen.getByDisplayValue('curs-de-baza')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Descriere curs')).toBeInTheDocument()
  })

  it('renders link to editions', async () => {
    const CourseEditPage = (await import('../../cursuri/[id]/page')).default
    const jsx = await CourseEditPage({ params: Promise.resolve({ id: 'c1' }) })
    render(jsx)
    expect(screen.getByRole('link', { name: /Ediții/i })).toHaveAttribute('href', '/admin/cursuri/c1/editii')
  })
})

// ─── Editions List Page ────────────────────────────────────

describe('Editions List (/admin/cursuri/[id]/editii)', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.course.findUnique).mockResolvedValue({
      id: 'c1',
      title: 'Curs de bază',
    } as any)
    vi.mocked(prisma.courseEdition.findMany).mockResolvedValue([
      {
        id: 'e1',
        courseId: 'c1',
        editionNumber: 1,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-04-01'),
        enrollmentOpen: true,
        maxParticipants: 15,
        createdAt: new Date(),
        _count: { enrollments: 5 },
      },
      {
        id: 'e2',
        courseId: 'c1',
        editionNumber: 2,
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-06-01'),
        enrollmentOpen: false,
        maxParticipants: 20,
        createdAt: new Date(),
        _count: { enrollments: 0 },
      },
    ] as any)
  })

  it('renders editions for a course', async () => {
    const EditionsPage = (await import('../../cursuri/[id]/editii/page')).default
    const jsx = await EditionsPage({ params: Promise.resolve({ id: 'c1' }) })
    render(jsx)
    expect(screen.getByText('Ediția 1')).toBeInTheDocument()
    expect(screen.getByText('Ediția 2')).toBeInTheDocument()
  })

  it('shows enrollment count per edition', async () => {
    const EditionsPage = (await import('../../cursuri/[id]/editii/page')).default
    const jsx = await EditionsPage({ params: Promise.resolve({ id: 'c1' }) })
    render(jsx)
    expect(screen.getByText('5 cursanți')).toBeInTheDocument()
    expect(screen.getByText('0 cursanți')).toBeInTheDocument()
  })

  it('renders "Adaugă ediție" button', async () => {
    const EditionsPage = (await import('../../cursuri/[id]/editii/page')).default
    const jsx = await EditionsPage({ params: Promise.resolve({ id: 'c1' }) })
    render(jsx)
    expect(screen.getByText('Adaugă ediție')).toBeInTheDocument()
  })
})

// ─── New Edition Page ──────────────────────────────────────

describe('New Edition (/admin/cursuri/[id]/editii/new)', () => {
  it('renders form with required fields', async () => {
    const { useParams } = await import('next/navigation')
    vi.mocked(useParams).mockReturnValue({ id: 'c1' })

    const NewEditionPage = (await import('../../cursuri/[id]/editii/new/page')).default
    render(<NewEditionPage />)
    expect(screen.getByLabelText(/Număr ediție/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Data început/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Data sfârșit/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Locuri maxime/i)).toBeInTheDocument()
  })
})

// ─── Lessons Page ──────────────────────────────────────────

describe('Lessons (/admin/cursuri/[id]/editii/[editionId]/lectii)', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.courseEdition.findUnique).mockResolvedValue({
      id: 'e1',
      courseId: 'c1',
      editionNumber: 1,
    } as any)
    vi.mocked(prisma.lesson.findMany).mockResolvedValue([
      {
        id: 'l1',
        editionId: 'e1',
        title: 'Introducere',
        order: 1,
        videoKey: 'video-1.mp4',
        duration: 45,
        availableFrom: new Date('2026-03-01'),
        createdAt: new Date(),
      },
      {
        id: 'l2',
        editionId: 'e1',
        title: 'Lecția 2',
        order: 2,
        videoKey: null,
        duration: null,
        availableFrom: null,
        createdAt: new Date(),
      },
    ] as any)
  })

  it('renders lesson list with add button', async () => {
    const LessonsPage = (await import('../../cursuri/[id]/editii/[editionId]/lectii/page')).default
    const jsx = await LessonsPage({ params: Promise.resolve({ id: 'c1', editionId: 'e1' }) })
    render(jsx)
    expect(screen.getByText('Introducere')).toBeInTheDocument()
    expect(screen.getByText('Lecția 2')).toBeInTheDocument()
    expect(screen.getByText('Adaugă lecție')).toBeInTheDocument()
  })

  it('shows lesson duration in minutes', async () => {
    const LessonsPage = (await import('../../cursuri/[id]/editii/[editionId]/lectii/page')).default
    const jsx = await LessonsPage({ params: Promise.resolve({ id: 'c1', editionId: 'e1' }) })
    render(jsx)
    expect(screen.getByText('45 min')).toBeInTheDocument()
  })
})

// ─── Enrolled Students Page ────────────────────────────────

describe('Enrolled Students (/admin/cursuri/[id]/editii/[editionId]/cursanti)', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.courseEdition.findUnique).mockResolvedValue({
      id: 'e1',
      courseId: 'c1',
      editionNumber: 1,
    } as any)
    vi.mocked(prisma.courseEnrollment.findMany).mockResolvedValue([
      {
        id: 'en1',
        userId: 'u1',
        editionId: 'e1',
        orderId: 'ord-1',
        status: 'ACTIVE',
        accessExpiresAt: new Date('2026-05-01'),
        createdAt: new Date('2026-03-01'),
        user: { id: 'u1', name: 'Ana Popescu', email: 'ana@test.com' },
      },
      {
        id: 'en2',
        userId: 'u2',
        editionId: 'e1',
        orderId: 'ord-2',
        status: 'EXPIRED',
        accessExpiresAt: new Date('2026-01-01'),
        createdAt: new Date('2025-12-01'),
        user: { id: 'u2', name: 'Ion Vasile', email: 'ion@test.com' },
      },
    ] as any)
  })

  it('renders student list', async () => {
    const StudentsPage = (await import('../../cursuri/[id]/editii/[editionId]/cursanti/page')).default
    const jsx = await StudentsPage({ params: Promise.resolve({ id: 'c1', editionId: 'e1' }) })
    render(jsx)
    expect(screen.getByText('Ana Popescu')).toBeInTheDocument()
    expect(screen.getByText('Ion Vasile')).toBeInTheDocument()
  })

  it('shows enrollment status', async () => {
    const StudentsPage = (await import('../../cursuri/[id]/editii/[editionId]/cursanti/page')).default
    const jsx = await StudentsPage({ params: Promise.resolve({ id: 'c1', editionId: 'e1' }) })
    render(jsx)
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    expect(screen.getByText('EXPIRED')).toBeInTheDocument()
  })

  it('shows student email', async () => {
    const StudentsPage = (await import('../../cursuri/[id]/editii/[editionId]/cursanti/page')).default
    const jsx = await StudentsPage({ params: Promise.resolve({ id: 'c1', editionId: 'e1' }) })
    render(jsx)
    expect(screen.getByText('ana@test.com')).toBeInTheDocument()
    expect(screen.getByText('ion@test.com')).toBeInTheDocument()
  })
})

// ─── API: GET /api/admin/courses ───────────────────────────

describe('API: GET /api/admin/courses', () => {
  beforeEach(async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      expires: '2099-01-01',
    } as any)
  })

  it('returns courses list', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.course.findMany).mockResolvedValue([
      { id: 'c1', title: 'Curs 1', slug: 'curs-1' },
    ] as any)

    const { GET } = await import('../../../api/admin/courses/route')
    const res = await GET(new Request('http://localhost/api/admin/courses'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].title).toBe('Curs 1')
  })

  it('returns 401 for non-admin', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u2', name: 'User', email: 'user@test.com', role: 'USER' },
      expires: '2099-01-01',
    } as any)

    const { GET } = await import('../../../api/admin/courses/route')
    const res = await GET(new Request('http://localhost/api/admin/courses'))
    expect(res.status).toBe(401)
  })
})

// ─── API: POST /api/admin/courses ──────────────────────────

describe('API: POST /api/admin/courses', () => {
  beforeEach(async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      expires: '2099-01-01',
    } as any)
  })

  it('creates a course', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.course.create).mockResolvedValue({
      id: 'c-new',
      title: 'Curs nou',
      slug: 'curs-nou',
      description: 'Desc',
      price: 199,
    } as any)

    const { POST } = await import('../../../api/admin/courses/route')
    const res = await POST(
      new Request('http://localhost/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Curs nou', slug: 'curs-nou', description: 'Desc', price: 199 }),
      })
    )
    const data = await res.json()
    expect(res.status).toBe(201)
    expect(data.title).toBe('Curs nou')
  })
})

// ─── API: POST /api/admin/editions ─────────────────────────

describe('API: POST /api/admin/editions', () => {
  beforeEach(async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      expires: '2099-01-01',
    } as any)
  })

  it('creates an edition', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.courseEdition.create).mockResolvedValue({
      id: 'e-new',
      courseId: 'c1',
      editionNumber: 3,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-01'),
      maxParticipants: 15,
    } as any)

    const { POST } = await import('../../../api/admin/editions/route')
    const res = await POST(
      new Request('http://localhost/api/admin/editions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: 'c1',
          editionNumber: 3,
          startDate: '2026-06-01',
          endDate: '2026-07-01',
          maxParticipants: 15,
        }),
      })
    )
    const data = await res.json()
    expect(res.status).toBe(201)
    expect(data.editionNumber).toBe(3)
  })
})

// ─── API: PUT /api/admin/lessons/[id] ──────────────────────

describe('API: PUT /api/admin/lessons/[id]', () => {
  beforeEach(async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      expires: '2099-01-01',
    } as any)
  })

  it('updates lesson order', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.lesson.update).mockResolvedValue({
      id: 'l1',
      editionId: 'e1',
      title: 'Introducere',
      order: 3,
      videoKey: 'video-1.mp4',
      duration: 45,
      availableFrom: null,
      createdAt: new Date(),
    } as any)

    const { PUT } = await import('../../../api/admin/lessons/[id]/route')
    const res = await PUT(
      new Request('http://localhost/api/admin/lessons/l1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: 3 }),
      }),
      { params: Promise.resolve({ id: 'l1' }) }
    )
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.order).toBe(3)
  })
})
