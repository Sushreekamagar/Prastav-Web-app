import { Link } from 'react-router-dom'
import { HiOutlineBell, HiOutlineChatAlt2 } from 'react-icons/hi'
import { useLocation } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationContext'
import { SidebarToggle } from './Sidebar'
import UserDropdown from '../layout/UserDropdown'
import Breadcrumbs from '../ui/Breadcrumbs'
import { buildBreadcrumbs } from '../../utils/navigation'

export default function DashboardHeader({ title, subtitle, breadcrumbs, onMenuToggle, menuOpen }) {
  const { unreadCount } = useNotifications()
  const { pathname } = useLocation()
  const crumbs = breadcrumbs || buildBreadcrumbs(pathname)

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarToggle onClick={onMenuToggle} open={menuOpen} />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">{title}</h1>
            {subtitle && <p className="truncate text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            to="/dashboard/chats"
            className="relative rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
            aria-label="Chats"
          >
            <HiOutlineChatAlt2 className="h-6 w-6" />
          </Link>

          <Link
            to="/dashboard/notifications"
            className="relative rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
            aria-label="Notifications"
          >
            <HiOutlineBell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <UserDropdown />
        </div>
      </div>
      {crumbs.length > 0 && (
        <div className="border-t border-gray-50 px-4 pb-3 pt-2 sm:px-6 lg:px-8">
          <Breadcrumbs items={crumbs} />
        </div>
      )}
    </header>
  )
}
