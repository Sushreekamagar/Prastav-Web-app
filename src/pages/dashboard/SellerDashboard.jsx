import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineBookOpen,
  HiOutlineInbox,
  HiOutlineSwitchHorizontal,
  HiOutlineCheckCircle,
  HiOutlineStar,
  HiOutlinePlus,
  HiOutlineClipboardList,
} from 'react-icons/hi'
import { DashboardPage } from '../../layouts/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import QuickActions from '../../components/dashboard/QuickActions'
import { RequestCardCompact } from '../../components/requests/RequestCard'
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton'
import PageTransition from '../../components/ui/PageTransition'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { getMyListings } from '../../services/bookService'
import { getRequests } from '../../services/requestService'
import { getSellerDashboardStats } from '../../services/dashboardService'
import { getConversations } from '../../services/chatService'
import { formatPrice, formatRelativeTime } from '../../utils/formatters'

export default function SellerDashboard() {
  const { user } = useAuth()
  const { notifications } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [listings, setListings] = useState([])
  const [requests, setRequests] = useState([])
  const [chats, setChats] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const [statsData, books, reqs, convos] = await Promise.all([
          getSellerDashboardStats(),
          getMyListings(),
          getRequests('incoming'),
          getConversations(),
        ])
        setStats(statsData)
        setListings(Array.isArray(books) ? books : books.listings || [])
        setRequests(Array.isArray(reqs) ? reqs.slice(0, 4) : (reqs.requests || []).slice(0, 4))
        setChats(Array.isArray(convos) ? convos.slice(0, 3) : [])
      } catch {
        /* handled by services */
      } finally {
        setLoading(false)
      }
    }
    load()
    window.addEventListener('refresh-data', load)
    return () => window.removeEventListener('refresh-data', load)
  }, [])

  const recentNotifs = notifications.slice(0, 3)
  const topPerformers = [...listings].slice(0, 3)

  if (loading) {
    return (
      <DashboardPage title="Dashboard" subtitle="Loading your seller dashboard...">
        <DashboardSkeleton />
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      title={`Welcome, ${user?.name?.split(' ')[0] || 'Seller'}!`}
      subtitle="Manage your listings, requests, and sales."
    >
      <PageTransition>
        <div className="rounded-2xl bg-gradient-to-r from-prastav-600 to-prastav-800 p-6 text-white shadow-lg sm:p-8">
          <h2 className="text-xl font-bold sm:text-2xl">Your Seller Dashboard</h2>
          <p className="mt-2 max-w-xl text-prastav-100">
            Track listings, respond to requests, verify payments, and grow your reputation.
          </p>
          <Button to="/dashboard/listings/new" variant="secondary" size="sm" className="mt-4">
            <HiOutlinePlus className="h-4 w-4" /> Add Book
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Books" value={stats?.totalBooks ?? listings.length} icon={HiOutlineBookOpen} to="/dashboard/listings" />
          <StatCard label="Pending Requests" value={stats?.pendingRequests ?? 0} icon={HiOutlineInbox} color="blue" to="/dashboard/requests?type=incoming" />
          <StatCard label="Active Transactions" value={stats?.activeTransactions ?? 0} icon={HiOutlineSwitchHorizontal} color="amber" to="/dashboard/transactions" />
          <StatCard label="Completed Sales" value={stats?.completedSales ?? 0} icon={HiOutlineCheckCircle} color="purple" to="/dashboard/transactions" />
          <StatCard label="Reputation" value={`${(stats?.reputationScore ?? user?.reputationScore ?? 3.0).toFixed(1)} ★`} icon={HiOutlineStar} to="/dashboard/profile" />
        </div>

        <div className="mt-8">
          <QuickActions
            actions={[
              { label: 'Add Book', to: '/dashboard/listings/new', icon: HiOutlinePlus },
              { label: 'Manage Listings', to: '/dashboard/listings', icon: HiOutlineBookOpen },
              { label: 'View Requests', to: '/dashboard/requests?type=incoming', icon: HiOutlineInbox },
              { label: 'Transactions', to: '/dashboard/transactions', icon: HiOutlineClipboardList },
            ]}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Requests</h2>
              <Button to="/dashboard/requests?type=incoming" variant="ghost" size="sm">View All</Button>
            </div>
            <div className="mt-4 space-y-3">
              {requests.length === 0 ? (
                <p className="text-sm text-gray-500">No incoming requests.</p>
              ) : (
                requests.map((req) => (
                  <RequestCardCompact key={req._id} request={req} />
                ))
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Notifications</h2>
              <Button to="/dashboard/notifications" variant="ghost" size="sm">View All</Button>
            </div>
            <div className="mt-4 space-y-3">
              {recentNotifs.length === 0 ? (
                <p className="text-sm text-gray-500">No notifications.</p>
              ) : (
                recentNotifs.map((n) => (
                  <Link
                    key={n._id}
                    to="/dashboard/notifications"
                    className="block rounded-xl bg-white p-4 shadow-sm hover:bg-prastav-50/50"
                  >
                    <p className="font-medium text-gray-900">{n.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatRelativeTime(n.createdAt)}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Chats</h2>
            <Button to="/dashboard/chats" variant="ghost" size="sm">Open Chats</Button>
          </div>
          <div className="mt-4 space-y-3">
            {chats.length === 0 ? (
              <p className="text-sm text-gray-500">Chats appear when buyers request your books.</p>
            ) : (
              chats.map((chat) => (
                <Link
                  key={chat._id}
                  to={`/dashboard/chats?conversation=${chat._id}`}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm hover:bg-prastav-50/50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{chat.participant?.name}</p>
                    <p className="truncate text-sm text-gray-500">{chat.lastMessage}</p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="rounded-full bg-prastav-700 px-2 py-0.5 text-xs font-bold text-white">
                      {chat.unreadCount}
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Book Performance</h2>
            <Button to="/dashboard/listings" variant="ghost" size="sm">Manage Books</Button>
          </div>
          <div className="mt-4 space-y-3">
            {topPerformers.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center shadow-md">
                <p className="text-gray-500">No listings yet.</p>
                <Button to="/dashboard/listings/new" size="sm" className="mt-3">Create First Listing</Button>
              </div>
            ) : (
              topPerformers.map((book) => (
                <Link
                  key={book._id}
                  to={`/dashboard/books/${book._id}`}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm hover:bg-prastav-50/50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{book.title}</p>
                    <p className="text-sm text-gray-500">{formatPrice(book.price)}</p>
                  </div>
                  <Badge variant={book.status === 'active' ? 'success' : 'default'}>
                    {book.status || 'active'}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </div>
      </PageTransition>
    </DashboardPage>
  )
}
