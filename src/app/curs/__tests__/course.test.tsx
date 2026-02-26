import React from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/components/SecureVideoPlayer', () => ({
  SecureVideoPlayer: ({ lessonId }: { lessonId: string }) => <div data-testid="secure-video-player">Player {lessonId}</div>,
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    courseEdition: {
      findUnique: vi.fn(),
    },
    lesson: {
      findUnique: vi.fn(),
    },
    lessonProgress: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

describe('Course user pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders course overview lesson list', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/db')
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)

    vi.mocked(prisma.courseEdition.findUnique).mockResolvedValue({
      id: 'edition-1',
      editionNumber: 11,
      course: { title: 'Curs A.D.O.' },
      enrollments: [{ id: 'enr-1', accessExpiresAt: new Date('2099-01-01') }],
      lessons: [
        { id: 'lesson-1', title: 'Introducere', order: 1, duration: 20, availableFrom: null },
        { id: 'lesson-2', title: 'A doua lecție', order: 2, duration: 30, availableFrom: null },
      ],
    } as any)

    vi.mocked(prisma.lessonProgress.findMany).mockResolvedValue([
      { lessonId: 'lesson-1', completed: true },
    ] as any)

    const CoursePage = (await import('../[editionSlug]/page')).default
    const jsx = await CoursePage({ params: Promise.resolve({ editionSlug: 'edition-1' }) })
    render(jsx)

    expect(screen.getByText('Introducere')).toBeInTheDocument()
    expect(screen.getByText('A doua lecție')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Revizuiește/i })).toHaveAttribute('href', '/curs/edition-1/lectia/lesson-1')
  })

  it('shows lock icon for unavailable lesson', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/db')
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)

    vi.mocked(prisma.courseEdition.findUnique).mockResolvedValue({
      id: 'edition-1',
      editionNumber: 11,
      course: { title: 'Curs A.D.O.' },
      enrollments: [{ id: 'enr-1', accessExpiresAt: new Date('2099-01-01') }],
      lessons: [
        { id: 'lesson-1', title: 'Lecție viitoare', order: 1, duration: 20, availableFrom: new Date('2099-01-02') },
      ],
    } as any)

    vi.mocked(prisma.lessonProgress.findMany).mockResolvedValue([] as any)

    const CoursePage = (await import('../[editionSlug]/page')).default
    const jsx = await CoursePage({ params: Promise.resolve({ editionSlug: 'edition-1' }) })
    render(jsx)

    expect(screen.getByText('🔒')).toBeInTheDocument()
  })

  it('shows access denied when user is not enrolled', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/db')
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)

    vi.mocked(prisma.courseEdition.findUnique).mockResolvedValue({
      id: 'edition-1',
      editionNumber: 11,
      course: { title: 'Curs A.D.O.' },
      enrollments: [],
      lessons: [],
    } as any)

    vi.mocked(prisma.lessonProgress.findMany).mockResolvedValue([] as any)

    const CoursePage = (await import('../[editionSlug]/page')).default
    const jsx = await CoursePage({ params: Promise.resolve({ editionSlug: 'edition-1' }) })
    render(jsx)

    expect(screen.getByText('Acces interzis')).toBeInTheDocument()
  })

  it('renders lesson page with secure player', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/db')
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)

    vi.mocked(prisma.lesson.findUnique).mockResolvedValue({
      id: 'lesson-2',
      title: 'A doua lecție',
      duration: 35,
      videoKey: 'video/master.m3u8',
      availableFrom: null,
      edition: {
        id: 'edition-1',
        course: { title: 'Curs A.D.O.' },
        enrollments: [{ id: 'enr-1', accessExpiresAt: new Date('2099-01-01') }],
        lessons: [
          { id: 'lesson-1', title: 'Prima', order: 1 },
          { id: 'lesson-2', title: 'A doua lecție', order: 2 },
          { id: 'lesson-3', title: 'A treia', order: 3 },
        ],
      },
    } as any)

    const LessonPage = (await import('../[editionSlug]/lectia/[lessonSlug]/page')).default
    const jsx = await LessonPage({ params: Promise.resolve({ editionSlug: 'edition-1', lessonSlug: 'lesson-2' }) })
    render(jsx)

    expect(screen.getByTestId('secure-video-player')).toBeInTheDocument()
  })

  it('renders lesson title on lesson page', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/db')
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)

    vi.mocked(prisma.lesson.findUnique).mockResolvedValue({
      id: 'lesson-2',
      title: 'A doua lecție',
      duration: 35,
      videoKey: 'video/master.m3u8',
      availableFrom: null,
      edition: {
        id: 'edition-1',
        course: { title: 'Curs A.D.O.' },
        enrollments: [{ id: 'enr-1', accessExpiresAt: new Date('2099-01-01') }],
        lessons: [
          { id: 'lesson-1', title: 'Prima', order: 1 },
          { id: 'lesson-2', title: 'A doua lecție', order: 2 },
          { id: 'lesson-3', title: 'A treia', order: 3 },
        ],
      },
    } as any)

    const LessonPage = (await import('../[editionSlug]/lectia/[lessonSlug]/page')).default
    const jsx = await LessonPage({ params: Promise.resolve({ editionSlug: 'edition-1', lessonSlug: 'lesson-2' }) })
    render(jsx)

    expect(screen.getByRole('heading', { level: 1, name: 'A doua lecție' })).toBeInTheDocument()
  })

  it('renders previous and next lesson navigation', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/db')
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)

    vi.mocked(prisma.lesson.findUnique).mockResolvedValue({
      id: 'lesson-2',
      title: 'A doua lecție',
      duration: 35,
      videoKey: 'video/master.m3u8',
      availableFrom: null,
      edition: {
        id: 'edition-1',
        course: { title: 'Curs A.D.O.' },
        enrollments: [{ id: 'enr-1', accessExpiresAt: new Date('2099-01-01') }],
        lessons: [
          { id: 'lesson-1', title: 'Prima', order: 1 },
          { id: 'lesson-2', title: 'A doua lecție', order: 2 },
          { id: 'lesson-3', title: 'A treia', order: 3 },
        ],
      },
    } as any)

    const LessonPage = (await import('../[editionSlug]/lectia/[lessonSlug]/page')).default
    const jsx = await LessonPage({ params: Promise.resolve({ editionSlug: 'edition-1', lessonSlug: 'lesson-2' }) })
    render(jsx)

    expect(screen.getByRole('link', { name: /Prima/i })).toHaveAttribute('href', '/curs/edition-1/lectia/lesson-1')
    expect(screen.getByRole('link', { name: /A treia/i })).toHaveAttribute('href', '/curs/edition-1/lectia/lesson-3')
  })

  it('shows access denied on lesson page when user is not enrolled', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/db')
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)

    vi.mocked(prisma.lesson.findUnique).mockResolvedValue({
      id: 'lesson-2',
      title: 'A doua lecție',
      duration: 35,
      videoKey: 'video/master.m3u8',
      availableFrom: null,
      edition: {
        id: 'edition-1',
        course: { title: 'Curs A.D.O.' },
        enrollments: [],
        lessons: [{ id: 'lesson-2', title: 'A doua lecție', order: 2 }],
      },
    } as any)

    const LessonPage = (await import('../[editionSlug]/lectia/[lessonSlug]/page')).default
    const jsx = await LessonPage({ params: Promise.resolve({ editionSlug: 'edition-1', lessonSlug: 'lesson-2' }) })
    render(jsx)

    expect(screen.getByText('Acces interzis')).toBeInTheDocument()
  })

  it('POST /api/lessons/[id]/progress marks lesson as watched', async () => {
    const { auth } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/db')
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)
    vi.mocked(prisma.lessonProgress.upsert).mockResolvedValue({ id: 'progress-1' } as any)

    const { POST } = await import('@/app/api/lessons/[id]/progress/route')
    const res = await POST(new Request('http://localhost/api/lessons/lesson-1/progress', { method: 'POST' }), {
      params: Promise.resolve({ id: 'lesson-1' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(prisma.lessonProgress.upsert).toHaveBeenCalledWith({
      where: { userId_lessonId: { userId: 'user-1', lessonId: 'lesson-1' } },
      update: { completed: true },
      create: { userId: 'user-1', lessonId: 'lesson-1', completed: true },
    })
  })
})
