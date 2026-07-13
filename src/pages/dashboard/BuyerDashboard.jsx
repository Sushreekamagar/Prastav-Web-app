import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineInbox,
  HiOutlineCreditCard,
  HiOutlineCheckCircle,
  HiOutlineSearch,
  HiOutlineLocationMarker,
  HiOutlineClipboardList,
} from 'react-icons/hi'
import { DashboardPage } from '../../layouts/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import BookCard from '../../components/books/BookCard'
import Button from '../../components/ui/Button'
import QuickActions from '../../components/dashboard/QuickActions'
import { RequestCardCompact } from '../../components/requests/RequestCard'
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton'
import PageTransition from '../../components/ui/PageTransition'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { getRecommendations } from '../../services/bookService'
import { getRequests } from '../../services/requestService'
import { getBuyerDashboardStats } from '../../services/dashboardService'
import { getConversations } from '../../services/chatService'
import { formatRelativeTime } from '../../utils/formatters'

export default function BuyerDashboard() {
  const { user } = useAuth()
  const { notifications } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [books, setBooks] = useState([])
  const [nearbyBooks, setNearbyBooks] = useState([])
  const [requests, setRequests] = useState([])
  const [chats, setChats] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const [statsData, recs, reqs, convos] = await Promise.all([
          getBuyerDashboardStats(),
          getRecommendations(),
          getRequests('outgoing'),
          getConversations(),
        ])
        setStats(statsData)
        const allBooks = recs.books || []
        setBooks(allBooks.slice(0, 4))
        setNearbyBooks([...allBooks].sort((a, b) => (a.distance || 99) - (b.distance || 99)).slice(0, 3))
        setRequests(Array.isArray(reqs) ? reqs.slice(0, 3) : (reqs.requests || []).slice(0, 3))
        setChats(Array.isArray(convos) ? convos.slice(0, 3) : [])
      } catch {
        /* mock fallback handled in services */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const recentNotifs = notifications.slice(0, 3)

  if (loading) {
    return (
      <DashboardPage title="Dashboard" subtitle="Loading your buyer dashboard...">
        <DashboardSkeleton />
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      title={`Welcome, ${user?.name?.split(' ')[0] || 'Student'}!`}
      subtitle="Discover affordable academic books near you."
    >
      <PageTransition>
        <div className="rounded-2xl bg-gradient-to-r from-prastav-600 to-prastav-800 p-6 text-white shadow-lg sm:p-8">
          <h2 className="text-xl font-bold sm:text-2xl">Find Your Next Textbook</h2>
          <p className="mt-2 max-w-xl text-prastav-100">
            Browse recommendations, search nearby listings, and request books from trusted sellers.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button to="/dashboard/books" variant="secondary" size="sm">
              Browse Books
            </Button>
            <Button to="/dashboard/recommendations" variant="outline" size="sm" className="!border-white !text-white hover:!bg-white/10">
              View Recommendations
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Active Requests" value={stats?.activeRequests ?? 0} icon={HiOutlineInbox} color="blue" />
          <StatCard label="Pending Payments" value={stats?.pendingPayments ?? 0} icon={HiOutlineCreditCard} color="amber" />
          <StatCard label="Completed Purchases" value={stats?.completedPurchases ?? 0} icon={HiOutlineCheckCircle} color="purple" />
        </div>

        <div className="mt-8">
          <QuickActions
            actions={[
              { label: 'Browse Books', to: '/dashboard/books', icon: HiOutlineSearch },
              { label: 'My Requests', to: '/dashboard/requests', icon: HiOutlineClipboardList },
              { label: 'Transactions', to: '/dashboard/transactions', icon: HiOutlineCheckCircle },
              { label: 'Nearby Books', to: '/dashboard/nearby', icon: HiOutlineLocationMarker },
            ]}
          />
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recommended Books</h2>
          <Button to="/dashboard/recommendations" variant="ghost" size="sm">View All</Button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book._id} book={book} showRecommendation />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Nearby Books</h2>
          <Button to="/dashboard/nearby" variant="ghost" size="sm">View Map</Button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nearbyBooks.map((book) => (
            <BookCard key={`nearby-${book._id}`} book={book} />
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Active Requests</h2>
              <Button to="/dashboard/requests" variant="ghost" size="sm">View All</Button>
            </div>
            <div className="mt-4 space-y-3">
              {requests.length === 0 ? (
                <p className="text-sm text-gray-500">No active requests yet.</p>
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
                    className="block rounded-xl bg-white p-4 shadow-sm transition-colors hover:bg-prastav-50/50"
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
              <p className="text-sm text-gray-500">Start a request to chat with sellers.</p>
            ) : (
              chats.map((chat) => (
                <Link
                  key={chat._id}
                  to={`/dashboard/chats?conversation=${chat._id}`}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm hover:bg-prastav-50/50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{chat.participant?.name || chat.book?.title}</p>
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
      </PageTransition>
    </DashboardPage>
  )
}
