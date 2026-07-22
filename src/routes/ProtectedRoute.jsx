import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingScreen } from '../components/ui/Spinner'
import { isSellerAccess } from '../hooks/useDashboardMode'

export default function ProtectedRoute({ roles, sellerOnly }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()
  // Always call this hook at the top level (Rules of Hooks).
  // It may return undefined when there is no parent Outlet context (e.g. the
  // outermost ProtectedRoute), which is fine – we just forward whatever we get.
  const parentContext = useOutletContext()

  if (loading) {
    return <LoadingScreen message="Checking authentication..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Force users to set their preferences if they haven't yet
  // Admins skip this step — they don't have buyer/seller preferences
  if (user?.role !== 'admin' && !user?.preferencesSet && location.pathname !== '/dashboard/preferences') {
    return <Navigate to="/dashboard/preferences" replace />
  }

  if (sellerOnly && user?.role !== 'seller' && user?.role !== 'both') {
    return <Navigate to="/dashboard" replace />
  }

  if (roles && user?.role && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  // Forward parent outlet context so nested routes (e.g. inside DashboardLayout)
  // can still access context provided by their layout ancestor.
  return <Outlet context={parentContext} />
}

export function GuestRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
