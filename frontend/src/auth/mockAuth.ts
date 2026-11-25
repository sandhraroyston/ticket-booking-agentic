// Mock auth service (issue #5). Replaced by the real API client + JWT handling in #20.
// Users live in memory only; passwords are never written to storage or the console.

export class AuthError extends Error {
  readonly code: 'invalid_credentials' | 'email_taken'
  constructor(code: AuthError['code'], message: string) {
    super(message)
    this.code = code
  }
}

export interface AuthSession {
  token: string
}

// Demo account so login can be tried without signing up first.
const users = new Map<string, string>([['buyer@example.com', 'correct-horse-battery']])

const normalise = (email: string) => email.trim().toLowerCase()
const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
const newSession = (): AuthSession => ({ token: `mock-${crypto.randomUUID()}` })

export async function signup(email: string, password: string): Promise<AuthSession> {
  await delay()
  const key = normalise(email)
  if (users.has(key)) throw new AuthError('email_taken', 'Email already registered')
  users.set(key, password)
  return newSession()
}

export async function login(email: string, password: string): Promise<AuthSession> {
  await delay()
  if (users.get(normalise(email)) !== password) {
    throw new AuthError('invalid_credentials', 'Wrong email or password')
  }
  return newSession()
}

export function resetMockUsers() {
  users.clear()
  users.set('buyer@example.com', 'correct-horse-battery')
}
