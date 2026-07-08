import { useCallback, useMemo, useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const STORAGE_KEY = 'prastav_dashboard_mode'

export function useDashboardMode() {
  const { user } = useAuth()
  const [mode, setModeState] = useState(() => {
    if (user?.role === 'buyer') return 'buyer'
    if (user?.role === 'seller') return 'seller'
    return localStorage.getItem(STORAGE_KEY) || 'buyer'
  })

  useEffect(() => {
    if (user?.role === 'buyer') setModeState('buyer')
    else if (user?.role === 'seller') setModeState('seller')
  }, [user?.role])

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
  const canSwitch = user?.role === 'both'

  return { mode, setMode, isBuyer, isSeller, canSwitch }
}

export function isSellerAccess(user, mode = localStorage.getItem(STORAGE_KEY) || 'buyer') {
  if (!user) return false
  if (user.role === 'seller') return true
  if (user.role === 'both') return mode === 'seller'
  return false
}
