import { GRADES } from './bookConstants'

export function getGradeLabel(value) {
  return GRADES.find((g) => g.value === value)?.label || value
}

export function getDashboardHomePath(role, mode) {
  return '/dashboard'
}

export function getRoleLabel(role, mode) {
  if (role === 'both') return mode === 'seller' ? 'Seller' : 'Buyer'
  return role === 'seller' ? 'Seller' : 'Buyer'
}

export const ROUTE_BREADCRUMBS = {
  '/dashboard': [{ label: 'Dashboard' }],
  '/dashboard/books': [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Search Books' }],
  '/dashboard/recommendations': [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Recommendations' }],
  '/dashboard/nearby': [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Nearby Books' }],
  '/dashboard/requests': [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Requests' }],
  '/dashboard/transactions': [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Transactions' }],
  '/dashboard/notifications': [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Notifications' }],
  '/dashboard/chats': [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Chats' }],
  '/dashboard/profile': [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Profile' }],
  '/dashboard/settings': [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Settings' }],
  '/dashboard/listings': [{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Books' }],
  '/dashboard/listings/new': [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'My Books', to: '/dashboard/listings' },
    { label: 'Add Book' },
  ],
}

export function buildBreadcrumbs(pathname, extra = []) {
  if (extra.length) return extra
  const base = ROUTE_BREADCRUMBS[pathname]
  if (base) return base
  if (pathname.startsWith('/dashboard/books/')) {
    return [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Search Books', to: '/dashboard/books' },
      { label: 'Book Details' },
    ]
  }
  if (pathname.startsWith('/dashboard/requests/')) {
    return [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Requests', to: '/dashboard/requests' },
      { label: 'Request Details' },
    ]
  }
  if (pathname.startsWith('/dashboard/transactions/')) {
    return [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Transactions', to: '/dashboard/transactions' },
      { label: 'Transaction Details' },
    ]
  }
  if (pathname.startsWith('/dashboard/listings/edit/')) {
    return [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'My Books', to: '/dashboard/listings' },
      { label: 'Edit Book' },
    ]
  }
  return [{ label: 'Dashboard', to: '/dashboard' }]
}
