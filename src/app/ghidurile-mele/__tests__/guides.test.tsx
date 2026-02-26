import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next modules
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}))
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} />,
}))

// Mock auth & db
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))
vi.mock('@/lib/db', () => ({
  prisma: {
    guideAccess: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    guide: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock components
vi.mock('@/components/GuideReader', () => ({
  GuideReader: ({ guide, userEmail, userId }: any) => (
    <div data-testid="guide-reader" data-email={userEmail} data-userid={userId}>
      GuideReader:{guide.title}
    </div>
  ),
}))
vi.mock('@/components/AudiobookPlayer', () => ({
  AudiobookPlayer: ({ guideId, audioUrl }: any) => (
    <div data-testid="audiobook-player" data-guide-id={guideId}>
      AudiobookPlayer:{audioUrl}
    </div>
  ),
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const mockAuth = auth as ReturnType<typeof vi.fn>

// --- Guide Library Page ---
describe('GhidurileMelePage (library)', () => {
  let GhidurileMelePage: () => Promise<React.JSX.Element>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../page')
    GhidurileMelePage = mod.default
  })

  it('redirects to /logare when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    await expect(GhidurileMelePage()).rejects.toThrow('REDIRECT:/logare')
  })

  it('shows empty state when user has no guides', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com', role: 'USER' } })
    ;(prisma.guideAccess.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

    const jsx = await GhidurileMelePage()
    render(jsx)

    expect(screen.getByText('Nu ai achiziționat niciun ghid.')).toBeInTheDocument()
    expect(screen.getByText('Explorează ghidurile')).toBeInTheDocument()
  })

  it('renders purchased guides list', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com', role: 'USER' } })
    ;(prisma.guideAccess.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        guide: {
          id: 'g1',
          title: 'Ghid Test 1',
          slug: 'ghid-test-1',
          description: 'Descriere test',
          coverImage: '/cover1.jpg',
          audioKey: null,
        },
      },
      {
        guide: {
          id: 'g2',
          title: 'Ghid Audio',
          slug: 'ghid-audio',
          description: 'Cu audio',
          coverImage: null,
          audioKey: 'audio/file.mp3',
        },
      },
    ])

    const jsx = await GhidurileMelePage()
    render(jsx)

    expect(screen.getByText('Ghidurile mele')).toBeInTheDocument()
    expect(screen.getByText('Ghid Test 1')).toBeInTheDocument()
    expect(screen.getByText('Ghid Audio')).toBeInTheDocument()
    expect(screen.getByText('🎧 Audiobook')).toBeInTheDocument()
  })
})

// --- Guide Reader Page ---
describe('GuideReaderPage (reader)', () => {
  let GuideReaderPage: (props: { params: Promise<{ slug: string }> }) => Promise<React.JSX.Element>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../[slug]/page')
    GuideReaderPage = mod.default
  })

  it('redirects to /logare when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    await expect(
      GuideReaderPage({ params: Promise.resolve({ slug: 'test' }) })
    ).rejects.toThrow('REDIRECT:/logare')
  })

  it('shows "Acces interzis" for unpurchased guide', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', email: 'user@test.com', role: 'USER' } })
    ;(prisma.guide.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'g1',
      title: 'Ghid Premium',
      slug: 'ghid-premium',
      description: 'Premium guide',
      contentJson: null,
      audioKey: null,
    })
    ;(prisma.guideAccess.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const jsx = await GuideReaderPage({ params: Promise.resolve({ slug: 'ghid-premium' }) })
    render(jsx)

    expect(screen.getByText('Acces interzis')).toBeInTheDocument()
    expect(screen.getByText('Nu ai achiziționat acest ghid.')).toBeInTheDocument()
  })

  it('renders GuideReader with user info for purchased guide', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', email: 'user@test.com', role: 'USER' } })
    ;(prisma.guide.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'g1',
      title: 'Ghid Accesat',
      slug: 'ghid-accesat',
      description: 'Accessible guide',
      contentJson: { pages: ['Page 1', 'Page 2'] },
      audioKey: null,
    })
    ;(prisma.guideAccess.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'ga1',
      userId: 'u1',
      guideId: 'g1',
    })

    const jsx = await GuideReaderPage({ params: Promise.resolve({ slug: 'ghid-accesat' }) })
    render(jsx)

    const reader = screen.getByTestId('guide-reader')
    expect(reader).toBeInTheDocument()
    expect(reader).toHaveAttribute('data-email', 'user@test.com')
    expect(reader).toHaveAttribute('data-userid', 'u1')
  })

  it('renders AudiobookPlayer when guide has audio', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', email: 'user@test.com', role: 'USER' } })
    ;(prisma.guide.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'g1',
      title: 'Ghid Audio',
      slug: 'ghid-audio',
      description: 'Guide with audio',
      contentJson: { pages: ['Content'] },
      audioKey: 'audio/guide.mp3',
    })
    ;(prisma.guideAccess.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'ga1',
      userId: 'u1',
      guideId: 'g1',
    })

    const jsx = await GuideReaderPage({ params: Promise.resolve({ slug: 'ghid-audio' }) })
    render(jsx)

    const player = screen.getByTestId('audiobook-player')
    expect(player).toBeInTheDocument()
    expect(player).toHaveAttribute('data-guide-id', 'g1')
  })

  it('does not render AudiobookPlayer when guide has no audio', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', email: 'user@test.com', role: 'USER' } })
    ;(prisma.guide.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'g1',
      title: 'Text Only',
      slug: 'text-only',
      description: 'No audio',
      contentJson: { pages: ['Content'] },
      audioKey: null,
    })
    ;(prisma.guideAccess.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'ga1',
      userId: 'u1',
      guideId: 'g1',
    })

    const jsx = await GuideReaderPage({ params: Promise.resolve({ slug: 'text-only' }) })
    render(jsx)

    expect(screen.queryByTestId('audiobook-player')).not.toBeInTheDocument()
    expect(screen.getByTestId('guide-reader')).toBeInTheDocument()
  })

  it('shows not found when guide does not exist', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', email: 'user@test.com', role: 'USER' } })
    ;(prisma.guide.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const jsx = await GuideReaderPage({ params: Promise.resolve({ slug: 'nonexistent' }) })
    render(jsx)

    expect(screen.getByText('Ghidul nu a fost găsit.')).toBeInTheDocument()
  })
})
