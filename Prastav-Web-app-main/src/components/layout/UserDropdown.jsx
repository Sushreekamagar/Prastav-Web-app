import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineUser, HiOutlineCog, HiOutlineLogout, HiOutlineSwitchHorizontal } from 'react-icons/hi'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { useDashboardMode } from '../../hooks/useDashboardMode'
import { getRoleLabel } from '../../utils/navigation'

export default function UserDropdown() {
  const { user, logout } = useAuth()
  const { mode, setMode, canSwitch } = useDashboardMode()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggleMode = () => {
    setMode(mode === 'buyer' ? 'seller' : 'buyer')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-prastav-500 focus:ring-offset-2"
        aria-label="User menu"
      >
        <Avatar name={user?.name} src={user?.avatar} size="sm" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1 shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
            <p className="mt-1 text-xs capitalize text-prastav-700">{getRoleLabel(user?.role, mode)} Mode</p>
          </div>

          {canSwitch && (
            <button
              type="button"
              onClick={toggleMode}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-prastav-50"
            >
              <HiOutlineSwitchHorizontal className="h-4 w-4" />
              Switch to {mode === 'buyer' ? 'Seller' : 'Buyer'}
            </button>
          )}

          <Link
            to="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-prastav-50"
          >
            <HiOutlineUser className="h-4 w-4" />
            Profile
          </Link>
          <Link
            to="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-prastav-50"
          >
            <HiOutlineCog className="h-4 w-4" />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              logout()
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <HiOutlineLogout className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
