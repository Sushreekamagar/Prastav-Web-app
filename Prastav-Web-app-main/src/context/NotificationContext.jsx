import { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const setNotificationData = useCallback((items) => {
    const normalized = items.map((n) => ({ ...n, read: n.read ?? n.isRead ?? false }))
    setNotifications(normalized)
    setUnreadCount(normalized.filter((n) => !n.read).length)
  }, [])

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true, isRead: true } : n)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })))
    setUnreadCount(0)
  }, [])

  const value = {
    notifications,
    unreadCount,
    setNotificationData,
    markAsRead,
    markAllAsRead,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

export default NotificationContext
