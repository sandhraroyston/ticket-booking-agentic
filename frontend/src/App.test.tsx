import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'
import { AppProviders } from './AppProviders.tsx'
import { createQueryClient } from './queryClient.ts'

function renderAt(path: string) {
  return render(
    <AppProviders queryClient={createQueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('App', () => {
  it('renders the placeholder home page', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1, name: /find your seat/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ticket booking/i })).toHaveAttribute('href', '/')
  })

  it('renders a not-found page for unknown routes and links back home', async () => {
    renderAt('/does-not-exist')
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: /back to home/i }))
    expect(screen.getByRole('heading', { name: /find your seat/i })).toBeInTheDocument()
  })
})
