const mongoose = require('mongoose');
const Book = require('../models/Book');
const AppError = require('../utils/AppError');
const { calculateHaversine } = require('./haversineService');

/**
 * Hybrid Recommendation Service — Module 4 (Prastav Capstone)
 *
 * Additive formula (3 weighted factors):
 *   Final = (BookSimilarity × 0.50) + (DistanceScore × 0.30) + (ReputationScore × 0.20)
 *
 * GradeScore is calculated separately and used as the PRIMARY SORT PRIORITY
 * (books matching buyer grade are ranked first, before the hybrid score is applied).
 *
 * Weights reflect priority: content match first, then proximity, then seller trust.
 */

const WEIGHTS = {
  bookSimilarity: 0.5,
  distance: 0.3,
  reputation: 0.2,
};

const DEFAULT_RADIUS_KM = 5;
const MAX_CANDIDATES = 2000; // cap in-memory scoring for performance on 50k dataset
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12; // increased so seller listings are always visible
const MAX_LIMIT = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const tokenize = (text) =>
  String(text || '')
    .toLowerCase()
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);

const normalizeGrade = (grade) =>
  String(grade || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/**
 * calculateBookSimilarity — Factor 1 (weight 50%)
 *
 * Compares search query against title, genre, keywords, author.
 * Supports partial keyword matching (e.g. "sci" matches "science").
 * Returns 0–1.
 */
const calculateBookSimilarity = (query, book) => {
  if (!query || !String(query).trim()) return 0.5;

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 0.5;

  const fieldMap = {
    title: String(book.title || '').toLowerCase(),
    author: String(book.author || '').toLowerCase(),
    genre: String(book.genre || '').toLowerCase(),
    keywords: String(book.keywords || '').toLowerCase(),
  };

  const fieldWeights = { title: 0.35, author: 0.25, genre: 0.2, keywords: 0.2 };

  let earned = 0;
  let possible = 0;

  queryTokens.forEach((token) => {
    Object.entries(fieldWeights).forEach(([field, weight]) => {
      possible += weight;
      const text = fieldMap[field];

      const exact = text.includes(token);
      const partial = text.split(/[\s,]+/).some(
        (word) => word.startsWith(token) || token.startsWith(word)
      );

      if (exact || partial) earned += weight;
    });
  });

  return possible === 0 ? 0 : Math.min(earned / possible, 1);
};

/**
 * getSellerCoordinates — Prefer seller.location, fallback to book.location.
 * Imported dataset books usually have neither — handled gracefully.
 */
const getSellerCoordinates = (book) => {
  const sellerCoords = book.seller?.location?.coordinates;
  if (Array.isArray(sellerCoords) && sellerCoords.length === 2) {
    return { longitude: sellerCoords[0], latitude: sellerCoords[1], source: 'seller' };
  }

  const bookCoords = book.location?.coordinates;
  if (Array.isArray(bookCoords) && bookCoords.length === 2) {
    return { longitude: bookCoords[0], latitude: bookCoords[1], source: 'book' };
  }

  return null;
};

/**
 * calculateDistanceScore — Factor 2 (weight 30%)
 *
 * Haversine distance between buyer and seller (or book) location.
 * Books with known location outside radius are excluded (withinRadius: false).
 * Missing location → neutral score 0.5 so imported books still appear.
 */
const calculateDistanceScore = (buyerLat, buyerLng, book, radiusKm) => {
  const coords = getSellerCoordinates(book);

  if (buyerLat == null || buyerLng == null || Number.isNaN(buyerLat) || Number.isNaN(buyerLng)) {
    return {
      distanceKm: null,
      distanceScore: 0.5,
      withinRadius: true,
      missingLocation: true,
      locationSource: null,
    };
  }

  if (!coords) {
    return {
      distanceKm: null,
      distanceScore: 0.5,
      withinRadius: true,
      missingLocation: true,
      locationSource: null,
    };
  }

  const distanceKm = calculateHaversine(
    buyerLat,
    buyerLng,
    coords.latitude,
    coords.longitude
  );

  if (distanceKm > radiusKm) {
    return {
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      distanceScore: 0,
      withinRadius: false,
      missingLocation: false,
      locationSource: coords.source,
    };
  }

  // Linear decay: 0 km → 1.0, at radius edge → ~0
  const distanceScore = Math.max(0, 1 - distanceKm / radiusKm);

  return {
    distanceKm: parseFloat(distanceKm.toFixed(2)),
    distanceScore: parseFloat(distanceScore.toFixed(4)),
    withinRadius: true,
    missingLocation: false,
    locationSource: coords.source,
  };
};

/**
 * calculateGradeScore — Factor 3 (weight 15%)
 *
 * Compares buyer grade (User.grade) with book Grade field.
 * Exact match = 1.0, adjacent class = 0.6, otherwise = 0.25.
 */
const calculateGradeScore = (buyerGrade, bookGrade) => {
  const buyer = normalizeGrade(buyerGrade);
  const book = normalizeGrade(bookGrade);

  if (!buyer || !book) return 0.5;

  if (buyer === book) return 1;

  const buyerNum = buyer.match(/\d+/);
  const bookNum = book.match(/\d+/);

  if (buyerNum && bookNum) {
    const diff = Math.abs(parseInt(buyerNum[0], 10) - parseInt(bookNum[0], 10));
    if (diff === 0) return 0.85;
    if (diff === 1) return 0.6;
  }

  return 0.25;
};

/**
 * calculateReputationScore — Factor 4 (weight 20%)
 *
 * For real seller listings: seller.reputationScore / 5 → 0–1.
 *   New sellers start at 3.0 → score 0.6 (neutral-good, not penalized).
 * For dataset-only catalog books: book.rating / 5, but only if rating > 0.
 *   rating = 0 (unrated) → 0.5 neutral so unrated catalog books don't outscore real sellers.
 */
const calculateReputationScore = (book) => {
  const sellerRep = book.seller?.reputationScore;

  // Real seller listing — use their account reputation
  if (sellerRep != null && !Number.isNaN(sellerRep)) {
    return Math.min(Math.max(sellerRep / 5, 0), 1);
  }

  // Dataset catalog book — only use rating if it is a real positive value
  if (book.rating != null && !Number.isNaN(book.rating) && book.rating > 0) {
    return Math.min(Math.max(book.rating / 5, 0), 1);
  }

  // Unrated dataset book → neutral score (don't reward/penalize unrated entries)
  return 0.5;
};

/**
 * computeFinalScore — Additive hybrid formula from capstone spec.
 * isRealListing bonus is applied SEPARATELY in the sort (not baked into score)
 * so the capstone formula weights remain academically accurate.
 */
const computeFinalScore = (bookSimilarity, distanceScore, reputationScore) => {
  const finalScore =
    (bookSimilarity * WEIGHTS.bookSimilarity) +
    (distanceScore * WEIGHTS.distance) +
    (reputationScore * WEIGHTS.reputation);

  return parseFloat(finalScore.toFixed(6));
};

const buildWhyRecommended = (scores, book, query) => {
  const reasons = [];

  if (scores.isRealListing) {
    reasons.push('Listed by a real student seller — available to buy/exchange now.');
  }

  if (scores.bookSimilarity >= 0.6) {
    reasons.push(`Strong content match for "${query || 'your interests'}" in title, author, genre, or keywords.`);
  } else if (scores.bookSimilarity >= 0.3) {
    reasons.push('Partial keyword match with your search query.');
  }

  if (scores.distanceKm != null && scores.withinRadius) {
    reasons.push(`Seller is ${scores.distanceKm} km away (within your search radius).`);
  } else if (scores.isRealListing && scores.missingLocation) {
    reasons.push('Seller location not set — update your profile to see distance.');
  } else if (scores.missingLocation) {
    reasons.push('Location unavailable — neutral distance score applied (common for imported catalogue books).');
  }

  if (scores.gradeScore >= 0.85) {
    reasons.push('Book grade closely matches your academic level.');
  } else if (scores.gradeScore >= 0.5) {
    reasons.push('Book grade is somewhat related to your level.');
  }

  if (scores.reputationScore >= 0.7) {
    reasons.push('Seller has a strong reputation rating.');
  }

  if (reasons.length === 0) {
    reasons.push('Recommended based on combined similarity, proximity, grade, and reputation scores.');
  }

  return reasons;
};

const formatRecommendation = (book, scores, query) => ({
  id: book._id,
  bookId: book.book_id,
  title: book.title,
  author: book.author,
  subject: book.genre,
  grade: book.Grade,
  keywords: book.keywords,
  rating: book.rating,
  condition: book.condition,
  description: book.description,
  publishYear: book.publish_year,
  listingType: book.listingType || null,
  price: book.price ?? 0,
  imageUrl: book.imageUrl || null,
  // isRealListing: true means a real student seller has listed this physical book
  isRealListing: scores.isRealListing || false,
  seller: book.seller
    ? {
        id: book.seller._id,
        _id: book.seller._id,
        name: book.seller.name,
        grade: book.seller.grade,
        district: book.seller.district || book.district || 'Nepal',
        reputationScore: book.seller.reputationScore ?? 3.0,
        reputation: book.seller.reputationScore ?? 3.0,
        location: book.seller.location || book.location,
      }
    : (book.sellerName ? {
        id: `catalog_${book._id || book.book_id}`,
        _id: `catalog_${book._id || book.book_id}`,
        name: book.sellerName,
        grade: book.Grade,
        district: book.district || 'Nepal',
        reputationScore: 4.2,
        reputation: 4.2,
        location: book.location,
        isDatasetSeller: true,
      } : null),
  scores: {
    bookSimilarity: scores.bookSimilarity,
    distanceScore: scores.distanceScore,
    gradeScore: scores.gradeScore,
    reputationScore: scores.reputationScore,
    isRealListing: scores.isRealListing,
    weighted: {
      bookSimilarity: parseFloat((scores.bookSimilarity * WEIGHTS.bookSimilarity).toFixed(4)),
      distance: parseFloat((scores.distanceScore * WEIGHTS.distance).toFixed(4)),
      reputation: parseFloat((scores.reputationScore * WEIGHTS.reputation).toFixed(4)),
    },
    distanceKm: scores.distanceKm,
    withinRadius: scores.withinRadius,
    missingLocation: scores.missingLocation,
    finalScore: scores.finalScore,
  },
  whyRecommended: buildWhyRecommended(scores, book, query),
});

/**
 * fetchSimilarCandidates — Finds books similar by genre, Grade, or author.
 */
const fetchSimilarCandidates = async (sourceBook, bookIdExclude) => {
  const baseFilter = {
    isAvailable: { $ne: false },
    isReported: { $ne: true },
    isDeleted: { $ne: true },
    _id: { $ne: bookIdExclude },
  };

  const orConditions = [
    ...(sourceBook.genre ? [{ genre: sourceBook.genre }] : []),
    ...(sourceBook.Grade ? [{ Grade: sourceBook.Grade }] : []),
    ...(sourceBook.author ? [{ author: sourceBook.author }] : []),
  ];

  const filter = orConditions.length > 0
    ? { ...baseFilter, $or: orConditions }
    : baseFilter;

  const SELECT = 'book_id title author genre keywords Grade rating description condition publish_year seller location listingType price';

  // IMPORTANT: Always fetch seller-linked (real marketplace) listings first,
  // regardless of rating, so they are never cut off by MAX_CANDIDATES cap.
  const [sellerBooks, datasetBooks] = await Promise.all([
    Book.find({ ...filter, seller: { $ne: null } })
      .select(SELECT)
      .populate('seller', 'name grade location district reputationScore')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean(),
    Book.find({ ...filter, seller: null })
      .select(SELECT)
      .sort({ rating: -1 })
      .limit(MAX_CANDIDATES - 500)
      .lean(),
  ]);

  return [...sellerBooks, ...datasetBooks];
};

/**
 * fetchCandidates — Optimised MongoDB pre-filter before in-memory hybrid scoring.
 * Uses indexed fields: title, author, genre, keywords (text/regex).
 * Limits to MAX_CANDIDATES documents to avoid loading all 50k books.
 */
const fetchCandidates = async (queryText, bookIdExclude = null) => {
  const baseFilter = {
    isAvailable: { $ne: false },
    isReported: { $ne: true },
    isDeleted: { $ne: true },
  };

  if (bookIdExclude) {
    baseFilter._id = { $ne: bookIdExclude };
  }

  const SELECT = 'book_id title author genre keywords Grade rating description condition publish_year seller location listingType price';

  let textFilter = {};
  if (queryText && String(queryText).trim()) {
    const regex = new RegExp(String(queryText).trim(), 'i');
    textFilter.$or = [
      { title: regex },
      { author: regex },
      { genre: regex },
      { keywords: regex },
    ];
  }

  // IMPORTANT: Fetch seller-linked (real marketplace) listings in a separate query
  // so they are NEVER cut off by the MAX_CANDIDATES cap, regardless of their rating.
  // New seller listings default to rating=0 and would otherwise be buried below
  // 50k+ dataset books and never reach the in-memory scoring phase.
  const [sellerBooks, datasetBooks] = await Promise.all([
    Book.find({ ...baseFilter, ...textFilter, seller: { $ne: null } })
      .select(SELECT)
      .populate('seller', 'name grade location district reputationScore')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean(),
    Book.find({ ...baseFilter, ...textFilter, seller: null })
      .select(SELECT)
      .sort({ rating: -1, publish_year: -1 })
      .limit(MAX_CANDIDATES - 500)
      .lean(),
  ]);

  return [...sellerBooks, ...datasetBooks];
};

/**
 * scoreBook — Runs all four factors and returns scored payload or null if excluded.
 * isRealListing = true when the book has a real student seller linked (not a dataset catalog entry).
 *
 * IMPORTANT: Real seller listings are NEVER excluded by radius — they are always scored and returned.
 * Only dataset catalog books (no real seller) are excluded when outside the buyer's radius.
 * This ensures a seller's listed book is always visible to any buyer regardless of distance.
 */
const scoreBook = (book, context) => {
  const {
    queryText,
    buyerLat,
    buyerLng,
    radiusKm,
    buyerGrade,
    enforceRadius,
  } = context;

  const bookSimilarity = parseFloat(
    calculateBookSimilarity(queryText, book).toFixed(4)
  );

  const distance = calculateDistanceScore(buyerLat, buyerLng, book, radiusKm);

  // isRealListing: true when a real student seller has listed this physical book
  const isRealListing = book.seller != null && typeof book.seller === 'object'
    ? true
    : (book.seller != null);

  // Radius exclusion: ONLY apply to dataset catalog books, never to real seller listings.
  // Real seller books always show up — their distance score naturally ranks closer ones higher.
  if (enforceRadius && !distance.withinRadius && !distance.missingLocation && !isRealListing) {
    return null;
  }

  const gradeScore = parseFloat(calculateGradeScore(buyerGrade, book.Grade).toFixed(4));
  const reputationScore = parseFloat(calculateReputationScore(book).toFixed(4));

  const finalScore = computeFinalScore(
    bookSimilarity,
    distance.distanceScore,
    reputationScore
  );

  return {
    book,
    scores: {
      bookSimilarity,
      distanceScore: distance.distanceScore,
      gradeScore,
      reputationScore,
      isRealListing,
      distanceKm: distance.distanceKm,
      withinRadius: distance.withinRadius,
      missingLocation: distance.missingLocation,
      locationSource: distance.locationSource,
      finalScore,
    },
  };
};

const resolveBuyerContext = (options = {}) => {
  const radiusKm = parseFloat(options.radius) || DEFAULT_RADIUS_KM;

  let buyerLat = options.latitude != null ? parseFloat(options.latitude) : null;
  let buyerLng = options.longitude != null ? parseFloat(options.longitude) : null;

  // Fallback to authenticated user's saved location [longitude, latitude]
  if ((buyerLat == null || buyerLng == null) && options.userLocation?.coordinates?.length === 2) {
    buyerLng = options.userLocation.coordinates[0];
    buyerLat = options.userLocation.coordinates[1];
  }

  const enforceRadius = buyerLat != null && buyerLng != null && !Number.isNaN(buyerLat) && !Number.isNaN(buyerLng);

  return {
    queryText: options.q || options.query || '',
    buyerLat,
    buyerLng,
    radiusKm,
    buyerGrade: options.buyerGrade || options.grade || null,
    enforceRadius,
  };
};

/**
 * GET /api/recommendations
 *
 * Sort priority (highest to lowest):
 *  1. isRealListing   — real student seller books ALWAYS above catalog-only books
 *  2. gradeScore      — grade match within each tier
 *  3. finalScore      — hybrid score as tiebreaker
 */
const getRecommendations = async (options = {}) => {
  const context = resolveBuyerContext(options);
  const { page, limit, skip } = parsePagination(options);

  const candidates = await fetchCandidates(context.queryText);

  const scored = candidates
    .map((book) => scoreBook(book, context))
    .filter(Boolean)
    .sort((a, b) => {
      // Tier 1: real seller listings always first
      const aReal = a.scores.isRealListing ? 1 : 0;
      const bReal = b.scores.isRealListing ? 1 : 0;
      if (bReal !== aReal) return bReal - aReal;

      // Tier 2: grade match
      if (b.scores.gradeScore !== a.scores.gradeScore) {
        return b.scores.gradeScore - a.scores.gradeScore;
      }

      // Tier 3: hybrid score
      return b.scores.finalScore - a.scores.finalScore;
    });

  const paginated = scored.slice(skip, skip + limit);

  return {
    page,
    limit,
    total: scored.length,
    count: paginated.length,
    radiusKm: context.radiusKm,
    query: context.queryText || null,
    buyerGrade: context.buyerGrade,
    weights: WEIGHTS,
    formula:
      '(BookSimilarity × 0.50) + (DistanceScore × 0.30) + (ReputationScore × 0.20)',
    recommendations: paginated.map(({ book, scores }) =>
      formatRecommendation(book, scores, context.queryText)
    ),
  };
};

/**
 * GET /api/recommendations/similar/:bookId
 */
const getSimilarRecommendations = async (bookId, options = {}) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    throw new AppError('Invalid book ID.', 400);
  }

  const source = await Book.findById(bookId).lean();
  if (!source) throw new AppError('Book not found.', 404);

  const pseudoQuery = [source.genre, source.author, ...(tokenize(source.keywords || ''))]
    .filter(Boolean)
    .join(' ');

  const context = resolveBuyerContext({
    ...options,
    q: pseudoQuery,
    buyerGrade: options.buyerGrade || options.grade || source.Grade,
  });

  const { page, limit, skip } = parsePagination(options);
  const candidates = await fetchSimilarCandidates(source, source._id);

  const scored = candidates
    .map((book) => scoreBook(book, context))
    .filter(Boolean)
    .sort((a, b) => {
      // Tier 1: real seller listings always first
      const aReal = a.scores.isRealListing ? 1 : 0;
      const bReal = b.scores.isRealListing ? 1 : 0;
      if (bReal !== aReal) return bReal - aReal;

      // Tier 2: grade match
      if (b.scores.gradeScore !== a.scores.gradeScore) {
        return b.scores.gradeScore - a.scores.gradeScore;
      }

      // Tier 3: hybrid score
      return b.scores.finalScore - a.scores.finalScore;
    });

  const paginated = scored.slice(skip, skip + limit);

  return {
    page,
    limit,
    total: scored.length,
    count: paginated.length,
    sourceBook: {
      id: source._id,
      title: source.title,
      author: source.author,
      subject: source.genre,
      grade: source.Grade,
    },
    recommendations: paginated.map(({ book, scores }) =>
      formatRecommendation(book, scores, pseudoQuery)
    ),
  };
};

/**
 * GET /api/recommendations/explain/:bookId
 */
const explainRecommendation = async (bookId, options = {}) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    throw new AppError('Invalid book ID.', 400);
  }

  const book = await Book.findById(bookId)
    .select(
      'book_id title author genre keywords Grade rating description condition publish_year seller location'
    )
    .populate('seller', 'name grade location district reputationScore')
    .lean();

  if (!book) throw new AppError('Book not found.', 404);

  const context = resolveBuyerContext(options);
  const queryText = options.q || context.queryText || book.genre || book.title;

  const scored = scoreBook(book, { ...context, queryText });

  if (!scored) {
    throw new AppError(
      `This book is outside your ${context.radiusKm} km search radius based on seller location.`,
      400
    );
  }

  const { scores } = scored;

  return {
    book: formatRecommendation(book, scores, queryText),
    explanation: {
      formula:
        '(BookSimilarity × 0.50) + (DistanceScore × 0.30) + (ReputationScore × 0.20)',
      weights: WEIGHTS,
      breakdown: {
        bookSimilarity: {
          score: scores.bookSimilarity,
          weight: WEIGHTS.bookSimilarity,
          weighted: parseFloat((scores.bookSimilarity * WEIGHTS.bookSimilarity).toFixed(4)),
          description:
            'Compares your query against title, author, genre, and keywords with partial matching.',
        },
        distance: {
          score: scores.distanceScore,
          weight: WEIGHTS.distance,
          weighted: parseFloat((scores.distanceScore * WEIGHTS.distance).toFixed(4)),
          distanceKm: scores.distanceKm,
          withinRadius: scores.withinRadius,
          missingLocation: scores.missingLocation,
          description:
            'Haversine distance between buyer and seller/book location. Default radius 5 km.',
        },
        grade: {
          score: scores.gradeScore,
          buyerGrade: context.buyerGrade,
          bookGrade: book.Grade,
          description: 'Used as the primary sorting priority. Higher when book Grade matches the buyer academic level.',
        },
        reputation: {
          score: scores.reputationScore,
          weight: WEIGHTS.reputation,
          weighted: parseFloat((scores.reputationScore * WEIGHTS.reputation).toFixed(4)),
          sellerReputation: book.seller?.reputationScore ?? null,
          bookRatingFallback: book.rating,
          description: 'Normalised seller reputation (reputationScore / 5). Falls back to book rating.',
        },
      },
      finalScore: scores.finalScore,
      whyRecommended: buildWhyRecommended(scores, book, queryText),
    },
  };
};

module.exports = {
  getRecommendations,
  getSimilarRecommendations,
  explainRecommendation,
  // Exported for unit testing / viva demos
  calculateBookSimilarity,
  calculateDistanceScore,
  calculateGradeScore,
  calculateReputationScore,
  computeFinalScore,
  WEIGHTS,
};
