import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Home', () => {
  it('renders a heading', () => {
    render(<Home />)

    const heading = screen.getByRole('heading', {
      name: /beatmaker platform/i,
    })

    expect(heading).toBeInTheDocument()
  })

  it('renders beat cards', () => {
    render(<Home />)
    
    const beatCards = screen.getAllByText(/beat title #/i)
    expect(beatCards).toHaveLength(3)
    
    const buttons = screen.getAllByRole('button', { name: /écouter/i })
    expect(buttons).toHaveLength(3)
  })
})
