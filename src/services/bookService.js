import api from './api'

export async function getBooks(params = {}) {
  const { data } = await api.get('/books', { params })
  if (data.books !== undefined) return data
  if (Array.isArray(data)) return { books: data, total: data.length, totalPages: 1 }
  return { books: [], total: 0, totalPages: 1 }
}

export async function getBookById(id) {
  const { data } = await api.get(`/books/${id}/details`)
  
  let book = data.book || data.data || data
  
  if (data.explanation) {
    book.recommendationFactors = data.explanation
    book.recommendationScore = data.explanation.finalScore ? Math.round(data.explanation.finalScore * 100) : null
  }
  
  return {
    ...book,
    _id: book._id || book.id
  }
}

export async function getRecommendations(params = {}) {
  const { data } = await api.get('/recommendations', { params })
  const books = (data.recommendations || []).map((r) => ({
    ...r,
    _id: r.id || r._id,
    recommendationScore: r.recommendationScore || (r.scores?.finalScore ? Math.round(r.scores.finalScore * 100) : null),
    distance: r.distance != null ? r.distance : (r.scores?.distanceKm != null ? parseFloat(r.scores.distanceKm.toFixed(1)) : null),
    recommendationFactors: r.recommendationFactors || (r.scores ? {
      titleMatch: (r.scores.bookSimilarity || 0) > 0,
      keywordMatch: (r.scores.bookSimilarity || 0) > 0.1,
      gradeMatch: (r.scores.gradeScore || 0) > 0,
      nearbySeller: (r.scores.distanceScore || 0) > 0,
      reputation: (r.scores.reputationScore || 0) > 0,
    } : null),
  }))
  return { books, total: data.total || books.length }
}

export async function getMyListings() {
  const { data } = await api.get('/books/my-listings')
  if (Array.isArray(data)) return data
  if (data.books) return data.books
  if (data.listings) return data.listings
  return []
}

export async function createListing(bookData) {
  const formData = new FormData()
  Object.entries(bookData).forEach(([key, value]) => {
    if (key === 'image') {
      if (value) formData.append('image', value)
    } else if (Array.isArray(value)) {
      value.forEach((val) => formData.append(key, val))
    } else if (value !== undefined && value !== null) {
      formData.append(key, value)
    }
  })
  const { data } = await api.post('/books', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.book || data
}

export async function updateListing(id, bookData) {
  const { data } = await api.put(`/books/${id}`, bookData)
  return data.book || data
}

export async function deleteListing(id) {
  const { data } = await api.delete(`/books/${id}`)
  return data
}

export async function getNearbySellers(params = {}) {
  const apiParams = {
    latitude: params.lat,
    longitude: params.lng,
    radius: params.radius || 5,
  }
  const { data } = await api.get('/books/nearby', { params: apiParams })
  const sellers = (data.books || []).map((book) => {
    if (!book.seller) return null
    return {
      _id: book.seller._id || book.seller.id,
      name: book.seller.name,
      district: book.seller.district || 'Unknown District',
      distance: book.distanceKm || 0,
      reputation: book.seller.reputationScore || 3.0,
      bookTitle: book.title,
      bookId: book._id,
    }
  }).filter(Boolean)
  return { sellers }
}
