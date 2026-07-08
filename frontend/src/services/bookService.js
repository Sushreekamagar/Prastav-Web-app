import api from './api'
import { MOCK_BOOKS } from '../utils/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function getBooks(params = {}) {
  if (USE_MOCK) {
    await delay(600)
    let books = [...MOCK_BOOKS]

    if (params.search) {
      const q = params.search.toLowerCase()
      books = books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.keywords.some((k) => k.toLowerCase().includes(q)),
      )
    }
    if (params.category) books = books.filter((b) => b.category === params.category)
    if (params.listingType) books = books.filter((b) => b.listingType === params.listingType)
    if (params.grade) books = books.filter((b) => b.grade === params.grade)
    if (params.condition) books = books.filter((b) => b.condition === params.condition)

    const page = params.page || 1
    const limit = params.limit || 12
    const start = (page - 1) * limit
    const paginated = books.slice(start, start + limit)

    return { books: paginated, total: books.length, page, totalPages: Math.ceil(books.length / limit) }
  }
  const { data } = await api.get('/books', { params })
  return data
}

export async function getBookById(id) {
  if (USE_MOCK) {
    await delay(400)
    const book = MOCK_BOOKS.find((b) => b._id === id)
    if (!book) throw new Error('Book not found')
    return book
  }
  const { data } = await api.get(`/books/${id}`)
  return data
}

export async function getRecommendations(params = {}) {
  if (USE_MOCK) {
    await delay(700)
    const sorted = [...MOCK_BOOKS].sort(
      (a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0),
    )
    return { books: sorted, total: sorted.length }
  }
  const { data } = await api.get('/books/recommendations', { params })
  return data
}

export async function getMyListings() {
  if (USE_MOCK) {
    await delay(500)
    return MOCK_BOOKS.slice(0, 3).map((b) => ({ ...b, seller: { _id: 'user_1', name: 'Sagar Thapa' } }))
  }
  const { data } = await api.get('/books/my-listings')
  return data
}

export async function createListing(bookData) {
  if (USE_MOCK) {
    await delay(1000)
    return { ...bookData, _id: 'book_new_' + Date.now(), status: 'active', createdAt: new Date().toISOString() }
  }
  const { data } = await api.post('/books', bookData)
  return data
}

export async function updateListing(id, bookData) {
  if (USE_MOCK) {
    await delay(800)
    return { ...bookData, _id: id }
  }
  const { data } = await api.put(`/books/${id}`, bookData)
  return data
}

export async function deleteListing(id) {
  if (USE_MOCK) {
    await delay(500)
    return { message: 'Listing deleted' }
  }
  const { data } = await api.delete(`/books/${id}`)
  return data
}

export async function getNearbySellers(params = {}) {
  if (USE_MOCK) {
    await delay(600)
    const sellers = MOCK_BOOKS.map((book) => ({
      ...book.seller,
      distance: book.distance,
      bookTitle: book.title,
      bookId: book._id,
    }))
    return { sellers }
  }
  const { data } = await api.get('/books/nearby-sellers', { params })
  return data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
