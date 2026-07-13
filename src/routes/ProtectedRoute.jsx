import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingScreen } from '../components/ui/Spinner'
import { isSellerAccess } from '../hooks/useDashboardMode'

export default function ProtectedRoute({ roles, sellerOnly }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen message="Checking authentication..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Force users to set their preferences if they haven't yet
  if (!user?.preferencesSet && location.pathname !== '/dashboard/preferences') {
    return <Navigate to="/dashboard/preferences" replace />
  }

  if (sellerOnly && !isSellerAccess(user)) {
    return <Navigate to="/dashboard" replace />
  }

  if (roles && user?.role && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
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
