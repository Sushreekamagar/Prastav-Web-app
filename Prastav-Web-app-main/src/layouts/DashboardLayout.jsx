import { useEffect, useState } from 'react'
import { Outlet, useOutletContext } from 'react-router-dom'
import Sidebar from '../components/dashboard/Sidebar'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import { useNotifications } from '../context/NotificationContext'
import { getNotifications } from '../services/notificationService'

function NotificationLoader() {
  const { setNotificationData } = useNotifications()

  useEffect(() => {
    async function load() {
      try {
        const data = await getNotifications()
        setNotificationData(Array.isArray(data) ? data : data.notifications || [])
      } catch {
        /* notifications optional on load */
      }
    }
    load()
  }, [setNotificationData])

  return null
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NotificationLoader />
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Outlet context={{ setMobileOpen, mobileOpen }} />
      </div>
    </div>
  )
}

export function DashboardPage({ title, subtitle, breadcrumbs, children }) {
  const { setMobileOpen, mobileOpen } = useOutletContext()

  return (
    <>
      <DashboardHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        onMenuToggle={() => setMobileOpen(!mobileOpen)}
        menuOpen={mobileOpen}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </>
  )
}

export function useDashboardLayout() {
  return useOutletContext()
}
