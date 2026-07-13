import { useCallback, useMemo, useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const STORAGE_KEY = 'prastav_dashboard_mode'

/**
 * useDashboardMode — determines which dashboard view to show.
 *
 * - role === 'buyer'  → always shows BuyerDashboard
 * - role === 'seller' → always shows SellerDashboard
 * - role === 'both'   → user can toggle between buyer/seller views (stored in localStorage)
 *
 * When a user switches role via Settings, their `user.role` in AuthContext changes,
 * so the dashboard automatically switches to the correct view.
 */
export function useDashboardMode() {
  const { user } = useAuth()

  const [mode, setModeState] = useState(() => {
    const role = user?.role
    if (role === 'buyer' || role === 'seller') return role
    if (role === 'both') return localStorage.getItem(STORAGE_KEY) || 'buyer'
    return 'buyer'
  })

  // Reactively sync mode when user.role changes (e.g. after role switch in Settings)
  useEffect(() => {
    const role = user?.role
    if (role === 'buyer') setModeState('buyer')
    else if (role === 'seller') setModeState('seller')
    else if (role === 'both') {
      setModeState(localStorage.getItem(STORAGE_KEY) || 'buyer')
    }
  }, [user?.role])

  // Only 'both' role users can manually toggle between buyer/seller view
  const setMode = useCallback(
    (next) => {
      setModeState(next)
      if (user?.role === 'both') {
        localStorage.setItem(STORAGE_KEY, next)
      }
    },
    [user?.role],
  )

  const isBuyer = useMemo(() => mode === 'buyer', [mode])
  const isSeller = useMemo(() => mode === 'seller', [mode])

  // Only 'both' role users can manually switch view without going to Settings
  const canSwitch = user?.role === 'both'

  return { mode, setMode, isBuyer, isSeller, canSwitch }
}

export function isSellerAccess(user, mode = localStorage.getItem(STORAGE_KEY) || 'buyer') {
  if (!user) return false
  if (user.role === 'seller') return true
  if (user.role === 'both') return mode === 'seller'
  return false
}
