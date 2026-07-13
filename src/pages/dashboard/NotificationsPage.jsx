import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineBell } from 'react-icons/hi'
import { toast } from 'react-toastify'
import { DashboardPage } from '../../layouts/DashboardLayout'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { LoadingScreen } from '../../components/ui/Spinner'
import PageTransition from '../../components/ui/PageTransition'
import { useNotifications } from '../../context/NotificationContext'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
} from '../../services/notificationService'
import { formatRelativeTime } from '../../utils/formatters'

const typeIcons = {
  request: '📩',
  payment: '💳',
  recommendation: '💡',
  rating: '⭐',
  transaction: '✅',
}

function getNotificationLink(notif) {
  if (notif.transactionId) return `/dashboard/transactions/${notif.transactionId}`
  if (notif.requestId) return `/dashboard/requests/${notif.requestId}`
  if (notif.bookId) return `/dashboard/books/${notif.bookId}`
  if (notif.type === 'recommendation') return '/dashboard/recommendations'
  return null
}

export default function NotificationsPage() {
  const { notifications, setNotificationData, markAsRead, markAllAsRead, unreadCount } =
    useNotifications()
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await getNotifications()
        setNotificationData(Array.isArray(data) ? data : data.notifications || [])
      } catch {
        /* empty */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [setNotificationData])

  const handleMarkAllRead = async () => {
    markAllAsRead()
    try {
      await markAllNotificationsRead()
    } catch {
      /* local state already updated */
    }
  }

  const handleOpen = async (notif) => {
    if (!notif.read) {
      markAsRead(notif._id)
      try {
        await markNotificationRead(notif._id)
      } catch {
        /* local updated */
      }
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteNotification(deleteId)
      setNotificationData(notifications.filter((n) => n._id !== deleteId))
      toast.success('Notification deleted')
      setDeleteId(null)
    } catch (err) {
      toast.error(err.message || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <LoadingScreen message="Loading notifications..." />

  return (
    <DashboardPage
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
    >
      <PageTransition>
        {unreadCount > 0 && (
          <div className="mb-4 flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          </div>
        )}

        {notifications.length === 0 ? (
          <EmptyState
            icon={HiOutlineBell}
            title="No notifications"
            description="You'll see updates about requests, payments, and recommendations here."
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const link = getNotificationLink(notif)
              const content = (
                <>
                  <span className="text-2xl">{typeIcons[notif.type] || '📌'}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-xs text-gray-400">{formatRelativeTime(notif.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{notif.message}</p>
                    <div className="mt-2 flex gap-3">
                      {link && (
                        <span className="text-xs font-medium text-prastav-700">Open related item →</span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setDeleteId(notif._id)
                        }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {!notif.read && (
                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-prastav-500" />
                  )}
                </>
              )

              const className = `flex w-full items-start gap-4 rounded-2xl p-5 text-left shadow-sm transition-colors hover:shadow-md ${
                notif.read ? 'bg-white' : 'bg-prastav-50 ring-1 ring-prastav-200'
              }`

              return link ? (
                <Link
                  key={notif._id}
                  to={link}
                  onClick={() => handleOpen(notif)}
                  className={className}
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={notif._id}
                  type="button"
                  onClick={() => handleOpen(notif)}
                  className={className}
                >
                  {content}
                </button>
              )
            })}
          </div>
        )}

        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Delete Notification"
          message="Are you sure you want to delete this notification?"
          confirmLabel="Delete"
          loading={deleting}
        />
      </PageTransition>
    </DashboardPage>
  )
}
