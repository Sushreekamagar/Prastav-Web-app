import { Link, useLocation } from 'react-router-dom'
import {
  HiOutlineHome,
  HiOutlineBookOpen,
  HiOutlineLightBulb,
  HiOutlineLocationMarker,
  HiOutlineClipboardList,
  HiOutlineInbox,
  HiOutlineBell,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlinePlus,
  HiOutlineSwitchHorizontal,
  HiOutlineChatAlt2,
  HiOutlineCog,
  HiOutlineUsers,
  HiOutlineDatabase,
} from 'react-icons/hi'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useDashboardMode } from '../../hooks/useDashboardMode'
import { APP_NAME } from '../../utils/constants'
import { BUYER_NAV, SELLER_NAV, ADMIN_NAV } from '../../utils/bookConstants'
import Avatar from '../ui/Avatar'
import { getRoleLabel } from '../../utils/navigation'

const iconMap = {
  home: HiOutlineHome,
  books: HiOutlineBookOpen,
  recommend: HiOutlineLightBulb,
  map: HiOutlineLocationMarker,
  list: HiOutlineClipboardList,
  add: HiOutlinePlus,
  requests: HiOutlineInbox,
  transactions: HiOutlineSwitchHorizontal,
  bell: HiOutlineBell,
  chat: HiOutlineChatAlt2,
  profile: HiOutlineUser,
  settings: HiOutlineCog,
  users: HiOutlineUsers,
  logs: HiOutlineDatabase,
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { pathname, search } = useLocation()
  const { user, logout } = useAuth()
  const { isSeller, mode } = useDashboardMode()

  const navItems = user?.role === 'admin' ? ADMIN_NAV : (isSeller ? SELLER_NAV : BUYER_NAV)

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-prastav-100 px-5 py-5">
        <Link to="/dashboard" className="text-xl font-bold text-prastav-800">
          {APP_NAME}
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <Avatar name={user?.name} src={user?.avatar} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="truncate text-xs capitalize text-gray-500">
              {getRoleLabel(user?.role, mode)}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon]
          const itemPath = item.path.split('?')[0]
          const isActive =
            pathname === itemPath ||
            (itemPath !== '/dashboard' && pathname.startsWith(itemPath)) ||
            (item.path.includes('?') && `${pathname}${search}` === item.path)

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-prastav-100 text-prastav-800'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-prastav-100 p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <HiOutlineLogout className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-prastav-100 bg-white lg:block">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export function SidebarToggle({ onClick, open }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
      aria-label="Toggle sidebar"
    >
      {open ? <HiOutlineX className="h-6 w-6" /> : <HiOutlineMenu className="h-6 w-6" />}
    </button>
  )
}
