import { Link, Route, Routes } from 'react-router'
import { AuthProvider, useAuth } from './auth/AuthContext.tsx'
import { RequireAuth } from './auth/RequireAuth.tsx'
import { AuthPage } from './pages/AuthPage.tsx'
import { EventPage } from './pages/EventPage.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { CheckoutPage, OrdersPage } from './pages/ProtectedPlaceholders.tsx'

function HeaderNav() {
  const { isAuthenticated, logout } = useAuth()
  return (
    <div className="flex items-center gap-4 text-sm">
      {isAuthenticated ? (
        <>
          <Link to="/orders">My orders</Link>
          <button type="button" onClick={logout} className="underline">
            Log out
          </button>
        </>
      ) : (
        <>
          <Link to="/login">Log in</Link>
          <Link to="/signup">Sign up</Link>
        </>
      )}
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold">
            Ticket Booking
          </Link>
          <HeaderNav />
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:id" element={<EventPage />} />
          <Route path="/login" element={<AuthPage key="login" mode="login" />} />
          <Route path="/signup" element={<AuthPage key="signup" mode="signup" />} />
          <Route element={<RequireAuth />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}
