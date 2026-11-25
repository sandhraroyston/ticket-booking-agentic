import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App.tsx'
import { AppProviders } from '../AppProviders.tsx'
import * as mockAuth from '../auth/mockAuth.ts'
import { createQueryClient } from '../queryClient.ts'

function renderAt(entry: string | { pathname: string; state?: unknown }) {
  return render(
    <AppProviders queryClient={createQueryClient()}>
      <MemoryRouter initialEntries={[entry]}>
        <App />
      </MemoryRouter>
    </AppProviders>,
  )
}

async function fill(email: string, password: string) {
  await userEvent.type(screen.getByLabelText('Email'), email)
  await userEvent.type(screen.getByLabelText('Password'), password)
}

const submit = (name: string) => userEvent.click(screen.getByRole('button', { name }))

describe('auth pages', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mockAuth.resetMockUsers()
    vi.restoreAllMocks()
  })

  it('signs up and redirects to the page I came from', async () => {
    renderAt({ pathname: '/signup', state: { from: '/orders' } })
    await fill('new@example.com', 'longenough1')
    await submit('Sign up')
    expect(await screen.findByRole('heading', { name: 'My orders' })).toBeInTheDocument()
  })

  it('signs up and redirects to / by default', async () => {
    renderAt('/signup')
    await fill('new@example.com', 'longenough1')
    await submit('Sign up')
    expect(await screen.findByRole('heading', { name: /upcoming events/i })).toBeInTheDocument()
  })

  it('logs in and shows My orders and Log out in the header; log out reverses it', async () => {
    renderAt('/login')
    await fill('buyer@example.com', 'correct-horse-battery')
    await submit('Log in')
    expect(await screen.findByRole('link', { name: 'My orders' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument()
  })

  it('shows inline validation errors and makes no request', async () => {
    const login = vi.spyOn(mockAuth, 'login')
    renderAt('/login')
    await fill('not-an-email', 'short')
    await submit('Log in')
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('shows an error for wrong credentials', async () => {
    renderAt('/login')
    await fill('buyer@example.com', 'wrong-password')
    await submit('Log in')
    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect email or password/i)
  })

  it('shows an error for a duplicate email on signup', async () => {
    renderAt('/signup')
    await fill('Buyer@Example.com', 'longenough1')
    await submit('Sign up')
    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i)
  })

  it.each(['/checkout', '/orders'])('redirects logged-out users from %s to /login', async (path) => {
    renderAt(path)
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument()
  })

  it('returns to the protected page after login', async () => {
    renderAt('/checkout')
    await fill('buyer@example.com', 'correct-horse-battery')
    await submit('Log in')
    expect(await screen.findByRole('heading', { name: 'Checkout' })).toBeInTheDocument()
  })

  it('never writes the password to storage or console', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      vi.spyOn(console, m),
    )
    renderAt('/login')
    await fill('buyer@example.com', 'correct-horse-battery')
    await submit('Log in')
    await screen.findByRole('link', { name: 'My orders' })
    const stored = JSON.stringify({ ...sessionStorage }) + JSON.stringify({ ...localStorage })
    expect(stored).not.toContain('correct-horse-battery')
    expect(stored).not.toContain('buyer@example.com')
    for (const s of spies) expect(s).not.toHaveBeenCalled()
  })
})
