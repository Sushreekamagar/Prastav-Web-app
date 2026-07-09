const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const Book = require('../models/Book');
const { calculateHaversine } = require('./haversineService');

const SELLER_FIELDS = 'name email reputationScore location';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * formatBook — Normalises DB fields to API-friendly shape.
 * Maps genre → subject, Grade → grade for the frontend.
 */
const formatBook = (book, extra = {}) => {
  const b = book.toObject ? book.toObject() : { ...book };

  return {
    id: b._id,
    bookId: b.book_id,
    title: b.title,
    author: b.author,
    subject: b.genre || b.subject || null,
    grade: b.Grade || b.grade || null,
    keywords: b.keywords || '',
    condition: b.condition,
    description: b.description,
    rating: b.rating,
    publishYear: b.publish_year,
    price: b.price ?? 0,
    imageUrl: b.imageUrl,
    seller: b.seller,
    location: b.location,
    isAvailable: b.isAvailable !== false,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    ...extra,
  };
};

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const baseAvailabilityFilter = () => ({
  isAvailable: { $ne: false },
  isReported: { $ne: true },
  isDeleted: { $ne: true },
});

/**
 * buildTextSearchFilter — MongoDB $or regex search across title, author, genre, keywords, Grade.
 *
 * Query used:
 *   db.books.find({ $or: [
 *     { title: /physics/i }, { author: /physics/i }, { genre: /physics/i },
 *     { keywords: /physics/i }, { Grade: /physics/i }
 *   ]})
 */
const buildTextSearchFilter = (searchTerm) => {
  if (!searchTerm || !String(searchTerm).trim()) return {};

  const regex = new RegExp(String(searchTerm).trim(), 'i');

  return {
    $or: [
      { title: regex },
      { author: regex },
      { genre: regex },
      { keywords: regex },
      { Grade: regex },
    ],
  };
};

/**
 * buildFilterQuery — Filters by subject(genre), condition, grade(Grade).
 */
const buildFilterQuery = ({ subject, condition, grade }) => {
  const filter = { ...baseAvailabilityFilter() };

  if (subject) filter.genre = new RegExp(String(subject).trim(), 'i');
  if (grade) filter.Grade = new RegExp(String(grade).trim(), 'i');
  if (condition) filter.condition = condition;

  return filter;
};

const applySort = (query, sortBy, userCoords) => {
  switch (sortBy) {
    case 'newest':
      // Imported books use publish_year; user listings use createdAt
      return query.sort({ publish_year: -1, createdAt: -1, book_id: -1 });
    case 'highest_rated':
    case 'highest_rated_seller':
      return query.sort({ rating: -1 });
    case 'nearest':
      // MongoDB $near handles nearest when location exists; fallback sort by rating
      return userCoords ? query : query.sort({ rating: -1 });
    default:
      return query.sort({ publish_year: -1, book_id: -1 });
  }
};

/**
 * getAllBooks — GET /books with pagination.
 */
const getAllBooks = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = baseAvailabilityFilter();

  const [books, total] = await Promise.all([
    Book.find(filter).sort({ publish_year: -1, book_id: -1 }).skip(skip).limit(limit).lean(),
    Book.countDocuments(filter),
  ]);

  return {
    page,
    limit,
    total,
    count: books.length,
    books: books.map((b) => formatBook(b)),
  };
};

/**
 * getBookById — GET /books/:id
 */
const getBookById = async (bookId) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    throw new AppError('Invalid book ID.', 400);
  }

  const book = await Book.findById(bookId).populate('seller', SELLER_FIELDS);

  if (!book) {
    throw new AppError('Book not found.', 404);
  }

  return formatBook(book);
};

/**
 * searchBooks — GET /books/search?q=...
 * Searches title, author, subject(genre), keywords, grade(Grade).
 */
const searchBooks = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const searchTerm = query.q || query.query || query.search || '';

  const filter = {
    ...baseAvailabilityFilter(),
    ...buildTextSearchFilter(searchTerm),
  };

  const mongoQuery = applySort(Book.find(filter), query.sort, null);

  const [books, total] = await Promise.all([
    mongoQuery.skip(skip).limit(limit).populate('seller', SELLER_FIELDS).lean(),
    Book.countDocuments(filter),
  ]);

  return {
    page,
    limit,
    total,
    count: books.length,
    searchTerm,
    books: books.map((b) => formatBook(b)),
  };
};

/**
 * filterBooks — GET /books/filter?subject=&condition=&grade=&sort=
 */
const filterBooks = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildFilterQuery(query);

  // Optional location text filter — matches keywords/description when books lack GPS
  if (query.location) {
    const locRegex = new RegExp(String(query.location).trim(), 'i');
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [{ keywords: locRegex }, { description: locRegex }],
      },
    ];
  }

  const mongoQuery = applySort(Book.find(filter), query.sort, null);

  const [books, total] = await Promise.all([
    mongoQuery.skip(skip).limit(limit).populate('seller', SELLER_FIELDS).lean(),
    Book.countDocuments(filter),
  ]);

  return {
    page,
    limit,
    total,
    count: books.length,
    filters: {
      subject: query.subject || null,
      condition: query.condition || null,
      grade: query.grade || null,
      location: query.location || null,
      sort: query.sort || 'newest',
    },
    books: books.map((b) => formatBook(b)),
  };
};

/**
 * getNearbyBooks — GET /books/nearby?latitude=&longitude=&radius=
 *
 * MongoDB query ($near on 2dsphere index):
 *   db.books.find({
 *     location: {
 *       $near: {
 *         $geometry: { type: 'Point', coordinates: [lon, lat] },
 *         $maxDistance: radiusKm * 1000
 *       }
 *     }
 *   })
 *
 * Imported dataset has no GPS — falls back to text-filtered list with geoAvailable: false.
 */
const getNearbyBooks = async (query = {}) => {
  const { latitude, longitude, radius = 10 } = query;

  if (!latitude || !longitude) {
    throw new AppError('latitude and longitude are required.', 400);
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const radiusKm = parseFloat(radius) || 10;
  const { page, limit, skip } = parsePagination(query);

  const booksWithGeo = await Book.countDocuments({
    ...baseAvailabilityFilter(),
    'location.coordinates.0': { $exists: true },
  });

  if (booksWithGeo === 0) {
    const filter = {
      ...baseAvailabilityFilter(),
      ...buildFilterQuery(query),
      ...buildTextSearchFilter(query.q || ''),
    };

    const [books, total] = await Promise.all([
      Book.find(filter)
        .sort({ rating: -1, publish_year: -1 })
        .skip(skip)
        .limit(limit)
        .populate('seller', SELLER_FIELDS)
        .lean(),
      Book.countDocuments(filter),
    ]);

    return {
      page,
      limit,
      total,
      count: books.length,
      geoAvailable: false,
      message:
        'Imported books have no GPS coordinates yet. Showing filtered results sorted by rating.',
      books: books.map((b) => formatBook(b)),
    };
  }

  const geoFilter = {
    ...baseAvailabilityFilter(),
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000,
      },
    },
  };

  if (query.subject) geoFilter.genre = new RegExp(String(query.subject).trim(), 'i');
  if (query.grade) geoFilter.Grade = new RegExp(String(query.grade).trim(), 'i');
  if (query.condition) geoFilter.condition = query.condition;

  const rawBooks = await Book.find(geoFilter)
    .limit(limit + skip)
    .populate('seller', SELLER_FIELDS);

  const withDistance = rawBooks
    .map((book) => {
      const coords = book.location?.coordinates;
      if (!coords) return null;

      const [bookLng, bookLat] = coords;
      const distanceKm = calculateHaversine(lat, lng, bookLat, bookLng);

      return formatBook(book, {
        distanceKm: parseFloat(distanceKm.toFixed(2)),
      });
    })
    .filter(Boolean)
    .slice(skip, skip + limit);

  return {
    page,
    limit,
    radiusKm,
    geoAvailable: true,
    count: withDistance.length,
    books: withDistance,
  };
};

/**
 * getSimilarBooks — GET /books/similar/:id
 * Scores overlap on title tokens, genre, author, keywords, Grade.
 */
const getSimilarBooks = async (bookId, query = {}) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    throw new AppError('Invalid book ID.', 400);
  }

  const source = await Book.findById(bookId).lean();

  if (!source) {
    throw new AppError('Book not found.', 404);
  }

  const limit = Math.min(parseInt(query.limit, 10) || 10, 50);

  const candidates = await Book.find({
    ...baseAvailabilityFilter(),
    _id: { $ne: source._id },
    $or: [
      { genre: source.genre },
      { Grade: source.Grade },
      { author: source.author },
    ],
  })
    .limit(200)
    .populate('seller', SELLER_FIELDS)
    .lean();

  const sourceKeywords = String(source.keywords || '')
    .toLowerCase()
    .split(/[,\s]+/)
    .filter(Boolean);

  const scored = candidates
    .map((book) => {
      let score = 0;

      if (book.genre === source.genre) score += 0.3;
      if (book.Grade === source.Grade) score += 0.25;
      if (book.author === source.author) score += 0.2;

      const bookKeywords = String(book.keywords || '')
        .toLowerCase()
        .split(/[,\s]+/)
        .filter(Boolean);

      const keywordOverlap = sourceKeywords.filter((k) => bookKeywords.includes(k)).length;
      if (sourceKeywords.length > 0) {
        score += (keywordOverlap / sourceKeywords.length) * 0.25;
      }

      const titleWords = String(source.title || '')
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const bookTitle = String(book.title || '').toLowerCase();
      const titleMatches = titleWords.filter((w) => bookTitle.includes(w)).length;
      if (titleWords.length > 0) {
        score += (titleMatches / titleWords.length) * 0.2;
      }

      return { book, similarityScore: parseFloat(Math.min(score, 1).toFixed(3)) };
    })
    .filter((item) => item.similarityScore > 0)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);

  return {
    sourceBookId: source._id,
    count: scored.length,
    books: scored.map(({ book, similarityScore }) =>
      formatBook(book, { similarityScore })
    ),
  };
};

// ── Seller listing operations (existing marketplace features) ─────────────────

const createBook = async (userId, body, file) => {
  const { title, author, subject, grade, condition, description, price, latitude, longitude } =
    body;

  if (!latitude || !longitude) {
    throw new AppError('latitude and longitude are required for new listings.', 400);
  }

  const book = await Book.create({
    title,
    author,
    genre: subject,
    Grade: grade,
    condition,
    description: description || '',
    price: parseFloat(price) || 0,
    seller: userId,
    imageUrl: file ? `/uploads/books/${file.filename}` : null,
    location: {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    },
  });

  await book.populate('seller', SELLER_FIELDS);
  return formatBook(book);
};

const getMyListings = async (userId) => {
  const books = await Book.find({ seller: userId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
  return books.map((b) => formatBook(b));
};

const updateBook = async (userId, bookId, body) => {
  const book = await Book.findById(bookId);
  if (!book) throw new AppError('Book not found.', 404);
  if (!book.seller || book.seller.toString() !== userId.toString()) {
    throw new AppError('Not authorized to edit this listing.', 403);
  }

  const updates = { ...body };
  if (updates.subject) {
    updates.genre = updates.subject;
    delete updates.subject;
  }
  if (updates.grade) {
    updates.Grade = updates.grade;
    delete updates.grade;
  }

  const updated = await Book.findByIdAndUpdate(bookId, updates, {
    returnDocument: 'after',
    runValidators: true,
  });

  return formatBook(updated);
};

const deleteBook = async (userId, bookId) => {
  const book = await Book.findById(bookId);
  if (!book) throw new AppError('Book not found.', 404);
  if (!book.seller || book.seller.toString() !== userId.toString()) {
    throw new AppError('Not authorized.', 403);
  }

  await book.deleteOne();
  return { message: 'Book listing deleted.' };
};

const reportBook = async (bookId) => {
  const book = await Book.findByIdAndUpdate(bookId, { isReported: true }, { returnDocument: 'after' });
  if (!book) throw new AppError('Book not found.', 404);
  return { message: 'Book reported. Admin will review within 24 hours.' };
};

module.exports = {
  getAllBooks,
  getBookById,
  searchBooks,
  filterBooks,
  getNearbyBooks,
  getSimilarBooks,
  createBook,
  getMyListings,
  updateBook,
  deleteBook,
  reportBook,
  formatBook,
};
