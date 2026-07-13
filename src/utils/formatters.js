export function formatPrice(amount) {
  if (amount == null || amount === 0) return 'Free'
  return `Rs. ${Number(amount).toLocaleString('en-NP')}`
}

export function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatRelativeTime(date) {
  if (!date) return ''
  const now = new Date()
  const then = new Date(date)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function getConditionLabel(value) {
  const map = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
  }
  return map[value] || value
}

export function getListingTypeLabel(value) {
  const map = { sell: 'For Sale', exchange: 'Exchange', donate: 'Donate' }
  return map[value] || value
}

export function getCategoryLabel(value) {
  const map = {
    science: 'Science',
    mathematics: 'Mathematics',
    engineering: 'Engineering',
    medicine: 'Medicine',
    management: 'Management',
    law: 'Law',
    arts: 'Arts & Humanities',
    language: 'Language & Literature',
    other: 'Other',
  }
  return map[value] || value
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}

export function getInitials(name) {
  return name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'
}
