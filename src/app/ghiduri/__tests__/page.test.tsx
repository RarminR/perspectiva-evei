import { render, screen } from '@testing-library/react'

// Mock next/link to render as plain anchors
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock next/image to render as plain img
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}))

// Mock prisma — pages use fallback data when DB is empty
vi.mock('@/lib/db', () => ({
  prisma: {
    guide: { findMany: vi.fn().mockResolvedValue([]) },
    bundle: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}))

describe('Guides listing page', () => {
  it('renders "Ghiduri" heading', async () => {
    const { default: GhiduriPage } = await import('../page')
    const page = await GhiduriPage()
    render(page)
    expect(screen.getByRole('heading', { name: /Ghiduri/i, level: 1 })).toBeInTheDocument()
  })

  it('renders fallback guide cards with titles', async () => {
    const { default: GhiduriPage } = await import('../page')
    const page = await GhiduriPage()
    render(page)
    expect(screen.getByText('Cine Manifestă?!')).toBeInTheDocument()
    expect(screen.getByText('Ghidul Abundenței')).toBeInTheDocument()
    expect(screen.getByText('Ghidul Relațiilor')).toBeInTheDocument()
  })

  it('renders guide prices', async () => {
    const { default: GhiduriPage } = await import('../page')
    const page = await GhiduriPage()
    render(page)
    // Each guide card shows €99 price
    const priceElements = screen.getAllByText(/€99/)
    expect(priceElements.length).toBeGreaterThanOrEqual(3)
  })

  it('renders bundle card with crossed-out original price and savings', async () => {
    const { default: GhiduriPage } = await import('../page')
    const page = await GhiduriPage()
    render(page)
    // Bundle card shows original price €110 crossed out
    expect(screen.getByText('€110')).toBeInTheDocument()
    // Bundle price
    expect(screen.getByText('€82.50')).toBeInTheDocument()
    // Savings badge
    expect(screen.getByText(/Economisești/i)).toBeInTheDocument()
  })

  it('renders CTA buttons linking to checkout', async () => {
    const { default: GhiduriPage } = await import('../page')
    const page = await GhiduriPage()
    render(page)
    const ctaButtons = screen.getAllByRole('link', { name: /Cumpără/i })
    expect(ctaButtons.length).toBeGreaterThanOrEqual(3)
  })

  it('renders bundle CTA button', async () => {
    const { default: GhiduriPage } = await import('../page')
    const page = await GhiduriPage()
    render(page)
    expect(screen.getByRole('link', { name: /Cumpără Pachetul/i })).toBeInTheDocument()
  })
})

describe('Guide detail page', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.mock('@/lib/db', () => ({
      prisma: {
        guide: {
          findUnique: vi.fn().mockResolvedValue({
            id: '1',
            title: 'Cine Manifestă?!',
            slug: 'cine-manifesta',
            price: 99,
            description: 'Ghidul care îți dezvăluie secretele manifestării conștiente.',
            coverImage: null,
            contentJson: null,
            audioKey: null,
            audioDuration: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
          findMany: vi.fn().mockResolvedValue([]),
        },
        bundle: { findFirst: vi.fn().mockResolvedValue(null) },
      },
    }))
  })

  it('renders guide title on detail page', async () => {
    const { default: GuideDetailPage } = await import('../../ghiduri/[slug]/page')
    const page = await GuideDetailPage({ params: Promise.resolve({ slug: 'cine-manifesta' }) })
    render(page)
    expect(screen.getByRole('heading', { name: /Cine Manifestă/i, level: 1 })).toBeInTheDocument()
  })

  it('renders guide description', async () => {
    const { default: GuideDetailPage } = await import('../../ghiduri/[slug]/page')
    const page = await GuideDetailPage({ params: Promise.resolve({ slug: 'cine-manifesta' }) })
    render(page)
    expect(screen.getByText(/secretele manifestării conștiente/i)).toBeInTheDocument()
  })

  it('renders guide price and CTA', async () => {
    const { default: GuideDetailPage } = await import('../../ghiduri/[slug]/page')
    const page = await GuideDetailPage({ params: Promise.resolve({ slug: 'cine-manifesta' }) })
    render(page)
    expect(screen.getAllByText(/€99/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('link', { name: /Cumpără/i })).toBeInTheDocument()
  })
})
