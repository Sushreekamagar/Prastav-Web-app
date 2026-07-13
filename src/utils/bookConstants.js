export const BOOK_CATEGORIES = [
  { value: 'science', label: 'Science' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'management', label: 'Management' },
  { value: 'law', label: 'Law' },
  { value: 'arts', label: 'Arts & Humanities' },
  { value: 'language', label: 'Language & Literature' },
  { value: 'other', label: 'Other' },
]

export const BOOK_CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

export const LISTING_TYPES = [
  { value: 'sell', label: 'Sell' },
  { value: 'exchange', label: 'Exchange' },
  { value: 'donate', label: 'Donate' },
]

export const GRADES = [
  { value: 'grade_9', label: 'Grade 9' },
  { value: 'grade_10', label: 'Grade 10' },
  { value: 'grade_11', label: 'Grade 11' },
  { value: 'grade_12', label: 'Grade 12' },
  { value: 'bachelor_1', label: 'Bachelor Year 1' },
  { value: 'bachelor_2', label: 'Bachelor Year 2' },
  { value: 'bachelor_3', label: 'Bachelor Year 3' },
  { value: 'bachelor_4', label: 'Bachelor Year 4' },
  { value: 'master', label: 'Master' },
]

export const USER_ROLES = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'both', label: 'Both Buyer & Seller' },
]

export const NEPAL_DISTRICTS = [
  'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Chitwan', 'Biratnagar',
  'Butwal', 'Dharan', 'Hetauda', 'Nepalgunj', 'Birgunj', 'Janakpur',
]

export const REQUEST_STATUS = {
  pending: { label: 'Pending', variant: 'warning' },
  accepted: { label: 'Accepted', variant: 'info' },
  rejected: { label: 'Rejected', variant: 'danger' },
  payment_pending: { label: 'Payment Pending', variant: 'warning' },
  payment_uploaded: { label: 'Payment Uploaded', variant: 'info' },
  payment_verified: { label: 'Payment Verified', variant: 'success' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'default' },
}

export const TRANSACTION_STATUSES = [
  'accepted',
  'payment_pending',
  'payment_uploaded',
  'payment_verified',
  'completed',
]

export const PAYMENT_METHODS = [
  { value: 'esewa', label: 'eSewa' },
  { value: 'khalti', label: 'Khalti' },
]

export const BUYER_NAV = [
  { label: 'Dashboard', path: '/dashboard', icon: 'home' },
  { label: 'Recommendations', path: '/dashboard/recommendations', icon: 'recommend' },
  { label: 'Nearby Books', path: '/dashboard/nearby', icon: 'map' },
  { label: 'Search Books', path: '/dashboard/books', icon: 'books' },
  { label: 'My Requests', path: '/dashboard/requests', icon: 'requests' },
  { label: 'Transactions', path: '/dashboard/transactions', icon: 'transactions' },
  { label: 'Notifications', path: '/dashboard/notifications', icon: 'bell' },
  { label: 'Chats', path: '/dashboard/chats', icon: 'chat' },
  { label: 'Profile', path: '/dashboard/profile', icon: 'profile' },
  { label: 'Settings', path: '/dashboard/settings', icon: 'settings' },
]

export const SELLER_NAV = [
  { label: 'Dashboard', path: '/dashboard', icon: 'home' },
  { label: 'My Books', path: '/dashboard/listings', icon: 'list' },
  { label: 'Add Book', path: '/dashboard/listings/new', icon: 'add' },
  { label: 'Pending Requests', path: '/dashboard/requests?type=incoming', icon: 'requests' },
  { label: 'Transactions', path: '/dashboard/transactions', icon: 'transactions' },
  { label: 'Notifications', path: '/dashboard/notifications', icon: 'bell' },
  { label: 'Chats', path: '/dashboard/chats', icon: 'chat' },
  { label: 'Profile', path: '/dashboard/profile', icon: 'profile' },
  { label: 'Settings', path: '/dashboard/settings', icon: 'settings' },
]

/** @deprecated Use BUYER_NAV or SELLER_NAV */
export const DASHBOARD_NAV = BUYER_NAV
