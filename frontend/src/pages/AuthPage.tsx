import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext.tsx'

type Mode = 'login' | 'signup'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mirrors openapi.yaml: SignupRequest.password minLength 8, LoginRequest.password minLength 1.
function validate(mode: Mode, email: string, password: string) {
  let passwordError: string | null = null
  if (mode === 'signup' && password.length < 8) passwordError = 'Password must be at least 8 characters.'
  if (mode === 'login' && password.length === 0) passwordError = 'Enter your password.'
  return {
    email: EMAIL_RE.test(email) ? null : 'Enter a valid email address.',
    password: passwordError,
  }
}

function safeFrom(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/'
}

export function AuthPage({ mode }: { mode: Mode }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = safeFrom(location.state)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<ReturnType<typeof validate> | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const isSignup = mode === 'signup'

  if (auth.isAuthenticated && !busy) return <Navigate to={from} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const trimmedEmail = email.trim()
    const result = validate(mode, trimmedEmail, password)
    setErrors(result)
    if (result.email || result.password) return
    setBusy(true)
    try {
      await (isSignup ? auth.signup(trimmedEmail, password) : auth.login(trimmedEmail, password))
      void navigate(from, { replace: true })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
      setBusy(false)
    }
  }

  const inputClass = 'mt-1 w-full rounded border border-slate-300 px-3 py-2'

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-2xl font-semibold">{isSignup ? 'Sign up' : 'Log in'}</h1>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-red-700">
            {formError}
          </p>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors?.email ? true : undefined}
            aria-describedby={errors?.email ? 'email-error' : undefined}
            className={inputClass}
          />
          {errors?.email && (
            <p id="email-error" className="mt-1 text-sm text-red-700">
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={errors?.password ? true : undefined}
            aria-describedby={errors?.password ? 'password-error' : undefined}
            className={inputClass}
          />
          {errors?.password && (
            <p id="password-error" className="mt-1 text-sm text-red-700">
              {errors.password}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {isSignup ? 'Sign up' : 'Log in'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        {isSignup ? (
          <>
            Already have an account?{' '}
            <Link to="/login" state={location.state} className="underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link to="/signup" state={location.state} className="underline">
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
