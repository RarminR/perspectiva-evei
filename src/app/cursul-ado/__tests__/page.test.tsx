import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock the course service
vi.mock('@/services/course', () => ({
  getCourseWithEditions: vi.fn(),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

import { getCourseWithEditions } from '@/services/course'
const mockGetCourse = vi.mocked(getCourseWithEditions)

// Import page — server component, default export is async
import CursulAdoPage from '../page'

// Helper to render async server component
async function renderPage() {
  const Page = await CursulAdoPage()
  render(Page)
}

describe('Cursul ADO Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('with active edition', () => {
    beforeEach(() => {
      mockGetCourse.mockResolvedValue({
        id: 'course-1',
        slug: 'cursul-ado',
        title: 'Cursul A.D.O.',
        description: 'Alege. Decide. Observă.',
        price: 1188,
        installmentPrice: 644,
        maxParticipants: 15,
        accessDurationDays: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
        editions: [
          {
            id: 'edition-1',
            courseId: 'course-1',
            editionNumber: 11,
            startDate: new Date('2026-03-01'),
            endDate: new Date('2026-04-26'),
            maxParticipants: 15,
            enrollmentOpen: true,
            createdAt: new Date(),
            _count: { enrollments: 7 },
          },
        ],
      })
    })

    it('renders with "Cursul A.D.O." heading', async () => {
      await renderPage()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Cursul A\.D\.O/i)
    })

    it('displays full payment price €1.188', async () => {
      await renderPage()
      expect(screen.getByText(/€1\.188/)).toBeInTheDocument()
    })

    it('displays installment price €644', async () => {
      await renderPage()
      expect(screen.getAllByText(/€644/).length).toBeGreaterThanOrEqual(1)
    })

    it('renders FAQ accordion with at least 5 questions', async () => {
      await renderPage()
      const faqButtons = screen.getAllByRole('button').filter(
        (btn) => btn.closest('[data-testid="faq-section"]')
      )
      expect(faqButtons.length).toBeGreaterThanOrEqual(5)
    })

    it('renders enrollment counter showing "locuri"', async () => {
      await renderPage()
      expect(screen.getByText(/locuri/i)).toBeInTheDocument()
    })

    it('shows enrollment count from DB (7/15)', async () => {
      await renderPage()
      expect(screen.getByText(/7\/15/)).toBeInTheDocument()
    })

    it('renders CTA button linking to checkout', async () => {
      await renderPage()
      const ctaLinks = screen.getAllByRole('link').filter(
        (link) => link.getAttribute('href')?.includes('/checkout')
      )
      expect(ctaLinks.length).toBeGreaterThan(0)
    })

    it('renders 8-week curriculum', async () => {
      await renderPage()
      expect(screen.getByText(/Săptămâna 1/i)).toBeInTheDocument()
      expect(screen.getByText(/Săptămâna 8/i)).toBeInTheDocument()
    })
  })

  describe('without active edition', () => {
    beforeEach(() => {
      mockGetCourse.mockResolvedValue(null)
    })

    it('shows enrollment-closed message when no course data', async () => {
      await renderPage()
      expect(screen.getByText(/Înscrierea se deschide în curând/i)).toBeInTheDocument()
    })
  })
})
