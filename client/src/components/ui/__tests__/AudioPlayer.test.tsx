import { render, screen, fireEvent } from '@testing-library/react'
import AudioPlayer from '../AudioPlayer'

// Mock HTMLMediaElement
window.HTMLMediaElement.prototype.play = jest.fn()
window.HTMLMediaElement.prototype.pause = jest.fn()

describe('AudioPlayer', () => {
  const mockSrc = '/test-audio.mp3'
  const mockOnPlay = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders audio player with initial state', () => {
    render(<AudioPlayer src={mockSrc} />)

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('calls onPlay callback when play button is clicked', () => {
    render(<AudioPlayer src={mockSrc} onPlay={mockOnPlay} />)

    const playButton = screen.getByRole('button')
    fireEvent.click(playButton)

    expect(mockOnPlay).toHaveBeenCalled()
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled()
  })

  it('toggles play/pause state when button is clicked', () => {
    render(<AudioPlayer src={mockSrc} />)

    const playButton = screen.getByRole('button')
    
    // Premier clic - Play
    fireEvent.click(playButton)
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled()
    
    // Deuxième clic - Pause
    fireEvent.click(playButton)
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled()
  })
})
