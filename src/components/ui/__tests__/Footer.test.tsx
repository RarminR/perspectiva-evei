import { render, screen } from '@testing-library/react'
import { Footer } from '../Footer'

describe('Footer', () => {
  it('links the ANPC SAL pictogram to the SAL complaints platform', () => {
    render(<Footer />)
    const img = screen.getByAltText('ANPC - Soluționarea alternativă a litigiilor (SAL)')
    expect(img).toHaveAttribute('width', '250')
    expect(img).toHaveAttribute('height', '50')
    const link = img.closest('a')
    expect(link).toHaveAttribute('href', 'https://reclamatiisal.anpc.ro/')
    expect(link).toHaveAttribute('target', '_blank')
  })
  it('does not link to the closed EU SOL/ODR platform', () => {
    const { container } = render(<Footer />)
    expect(container.querySelector('a[href*="ec.europa.eu/consumers/odr"]')).toBeNull()
  })
})
