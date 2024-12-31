import { render, screen } from '@testing-library/react'
import BeatCard from '../BeatCard'

const mockBeat = {
  id: '1',
  title: 'Test Beat',
  producer: {
    name: 'Test Producer',
    id: 'producer1'
  },
  coverImage: '/test-image.jpg',
  price: 29.99,
  genre: 'Hip Hop'
}

describe('BeatCard', () => {
  it('renders beat information correctly', () => {
    render(<BeatCard {...mockBeat} />)

    expect(screen.getByText(mockBeat.title)).toBeInTheDocument()
    expect(screen.getByText(mockBeat.producer.name)).toBeInTheDocument()
    expect(screen.getByText(`${mockBeat.price}€`)).toBeInTheDocument()
    expect(screen.getByText(mockBeat.genre)).toBeInTheDocument()
  })

  it('contains correct links', () => {
    render(<BeatCard {...mockBeat} />)

    const titleLink = screen.getByRole('link', { name: mockBeat.title })
    const producerLink = screen.getByRole('link', { name: mockBeat.producer.name })
    const detailsLink = screen.getByRole('link', { name: /plus de détails/i })

    expect(titleLink).toHaveAttribute('href', `/beats/${mockBeat.id}`)
    expect(producerLink).toHaveAttribute('href', `/producers/${mockBeat.producer.id}`)
    expect(detailsLink).toHaveAttribute('href', `/beats/${mockBeat.id}`)
  })

  it('has a play button', () => {
    render(<BeatCard {...mockBeat} />)
    
    const playButton = screen.getByRole('button', { name: /écouter/i })
    expect(playButton).toBeInTheDocument()
  })
})
