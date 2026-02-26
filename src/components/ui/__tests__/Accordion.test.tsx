import { render, screen, fireEvent } from '@testing-library/react'
import { Accordion } from '../Accordion'

const items = [
  { question: 'Ce este cursul?', answer: 'Un curs de manifestare.' },
  { question: 'Cât durează?', answer: '8 săptămâni.' },
]

describe('Accordion', () => {
  it('renders all questions', () => {
    render(<Accordion items={items} />)
    expect(screen.getByText('Ce este cursul?')).toBeInTheDocument()
    expect(screen.getByText('Cât durează?')).toBeInTheDocument()
  })
  it('expands item on click', () => {
    render(<Accordion items={items} />)
    fireEvent.click(screen.getByText('Ce este cursul?'))
    expect(screen.getByText('Un curs de manifestare.')).toBeInTheDocument()
  })
  it('collapses item on second click', () => {
    render(<Accordion items={items} />)
    fireEvent.click(screen.getByText('Ce este cursul?'))
    fireEvent.click(screen.getByText('Ce este cursul?'))
    expect(screen.queryByText('Un curs de manifestare.')).not.toBeInTheDocument()
  })
})
