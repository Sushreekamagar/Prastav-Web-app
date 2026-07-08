const asyncHandler = require('../utils/asyncHandler');
const bookService = require('../services/bookService');
const { explainRecommendation } = require('../services/recommendationService');
const { calculateHaversine } = require('../services/haversineService');

/**
 * Book Controller — coordinates HTTP only. Business logic in bookService.js.
 */

const getAllBooks = asyncHandler(async (req, res, next) => {
  const result = await bookService.getAllBooks(req.query);
  res.status(200).json({ success: true, ...result });
});

const getBook = asyncHandler(async (req, res, next) => {
  const book = await bookService.getBookById(req.params.id);
  res.status(200).json({ success: true, book });
});

const getBookDetails = asyncHandler(async (req, res, next) => {
  // If user is authenticated, we can fetch recommendation explanation and distance
  if (req.user) {
    try {
      const explainResult = await explainRecommendation(req.params.id, {
        latitude: req.user.location?.coordinates?.[1],
        longitude: req.user.location?.coordinates?.[0],
        buyerGrade: req.user.grade
      });
      return res.status(200).json({ 
        success: true, 
        book: explainResult.book,
        explanation: explainResult.explanation
      });
    } catch (err) {
      // If explain fails (e.g., outside radius or no coords), fallback to regular get
    }
  }

  // Fallback for unauthenticated or if explainRecommendation throws
  const book = await bookService.getBookById(req.params.id);
  
  // Calculate distance if lat/lng provided in query
  let distanceKm = null;
  if (req.query.latitude && req.query.longitude && book.location?.coordinates) {
    distanceKm = calculateHaversine(
      parseFloat(req.query.latitude),
      parseFloat(req.query.longitude),
      book.location.coordinates[1],
      book.location.coordinates[0]
    );
    book.distanceKm = parseFloat(distanceKm.toFixed(2));
  }
  
  res.status(200).json({ success: true, book });
});

const searchBooks = asyncHandler(async (req, res, next) => {
  const result = await bookService.searchBooks(req.query);
  res.status(200).json({ success: true, ...result });
});

const filterBooks = asyncHandler(async (req, res, next) => {
  const result = await bookService.filterBooks(req.query);
  res.status(200).json({ success: true, ...result });
});

const getNearbyBooks = asyncHandler(async (req, res, next) => {
  const result = await bookService.getNearbyBooks(req.query);
  res.status(200).json({ success: true, ...result });
});

const getSimilarBooks = asyncHandler(async (req, res, next) => {
  const result = await bookService.getSimilarBooks(req.params.id, req.query);
  res.status(200).json({ success: true, ...result });
});

const createBook = asyncHandler(async (req, res, next) => {
  const book = await bookService.createBook(req.user._id, req.body, req.file);
  res.status(201).json({ success: true, book });
});

const getMyListings = asyncHandler(async (req, res, next) => {
  const books = await bookService.getMyListings(req.user._id);
  res.status(200).json({ success: true, count: books.length, books });
});

const updateBook = asyncHandler(async (req, res, next) => {
  const book = await bookService.updateBook(req.user._id, req.params.id, req.body);
  res.status(200).json({ success: true, book });
});

const deleteBook = asyncHandler(async (req, res, next) => {
  const result = await bookService.deleteBook(req.user._id, req.params.id);
  res.status(200).json({ success: true, ...result });
});

const reportBook = asyncHandler(async (req, res, next) => {
  const result = await bookService.reportBook(req.params.id);
  res.status(200).json({ success: true, ...result });
});

module.exports = {
  getAllBooks,
  getBook,
  getBookDetails,
  searchBooks,
  filterBooks,
  getNearbyBooks,
  getSimilarBooks,
  createBook,
  getMyListings,
  updateBook,
  deleteBook,
  reportBook,
};
