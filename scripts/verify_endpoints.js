/**
 * verify_endpoints.js
 * ===================
 * Verifies that Search, Recommendation, Nearby Books, and Book Details
 * all work correctly with the enriched dataset — without starting the HTTP server.
 * Runs directly against MongoDB via the services layer.
 */

'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const bookService = require('../services/bookService');
const recommendationService = require('../services/recommendationService');
// Pre-register User model so Book.populate('seller') works in isolation
require('../models/User');

const PASS = '✅';
const FAIL = '❌';
const INFO = '   ';

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ${PASS}  ${label}${detail ? ' — ' + detail : ''}`);
    passed++;
  } else {
    console.log(`  ${FAIL}  ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function run() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🧪  Prastav API Endpoint Verification');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`  🔌  Connected: ${mongoose.connection.host}`);
  console.log('');

  // ── 1. getAllBooks ──────────────────────────────────────────────────────────
  console.log('  📚  getAllBooks');
  try {
    const result = await bookService.getAllBooks({ page: 1, limit: 10 });
    assert('Returns books array', Array.isArray(result.books));
    assert('Count > 0', result.total > 0, `total=${result.total}`);
    assert('Has pagination', result.page === 1 && result.limit === 10);
    const sample = result.books[0];
    assert('Book has id', !!sample?.id);
    assert('Book has title', !!sample?.title);
    assert('Book has author', !!sample?.author);
    assert('Book has location', !!sample?.location, JSON.stringify(sample?.location));
    assert('Book has price (number)', typeof sample?.price === 'number', `price=${sample?.price}`);
    assert('Book has rating (number)', typeof sample?.rating === 'number', `rating=${sample?.rating}`);
    assert('seller is null', sample?.seller === null, `seller=${sample?.seller}`);
  } catch (e) {
    assert('getAllBooks did not throw', false, e.message);
  }
  console.log('');

  // ── 2. searchBooks ─────────────────────────────────────────────────────────
  console.log('  🔍  searchBooks');
  try {
    const result = await bookService.searchBooks({ q: 'mathematics', limit: 5 });
    assert('Returns books array', Array.isArray(result.books));
    assert('Count > 0', result.count > 0, `count=${result.count}`);
    assert('searchTerm echoed', result.searchTerm === 'mathematics');

    const result2 = await bookService.searchBooks({ q: 'Cloud Computing', limit: 5 });
    assert('Search by title works', result2.count > 0, `found=${result2.count}`);

    const result3 = await bookService.searchBooks({ q: 'Thomas H. Cormen', limit: 5 });
    assert('Search by author works', result3.count > 0, `found=${result3.count}`);
  } catch (e) {
    assert('searchBooks did not throw', false, e.message);
  }
  console.log('');

  // ── 3. filterBooks ─────────────────────────────────────────────────────────
  console.log('  🎛️   filterBooks');
  try {
    const result = await bookService.filterBooks({ subject: 'science', limit: 5 });
    assert('Filter by subject', result.count > 0, `count=${result.count}`);
    assert('Filter echoed', result.filters?.subject === 'science');

    const result2 = await bookService.filterBooks({ grade: 'Grade 11', limit: 5 });
    assert('Filter by grade', result2.count > 0, `count=${result2.count}`);

    const result3 = await bookService.filterBooks({ condition: 'good', limit: 5 });
    assert('Filter by condition', result3.count > 0, `count=${result3.count}`);
  } catch (e) {
    assert('filterBooks did not throw', false, e.message);
  }
  console.log('');

  // ── 4. getNearbyBooks ──────────────────────────────────────────────────────
  console.log('  📍  getNearbyBooks (Nearby)');
  try {
    // Kathmandu coordinates
    const result = await bookService.getNearbyBooks({
      latitude: '27.7172',
      longitude: '85.3240',
      radius: '50',
      limit: 10,
    });
    assert('geoAvailable is true', result.geoAvailable === true, `geoAvailable=${result.geoAvailable}`);
    assert('Returns nearby books', result.count > 0, `count=${result.count}`);
    assert('Books have distanceKm', result.books[0]?.distanceKm !== undefined, `distanceKm=${result.books[0]?.distanceKm}`);
    assert('distanceKm within radius', result.books[0]?.distanceKm <= 50, `distanceKm=${result.books[0]?.distanceKm}`);

    // Test with Janakpur (different city)
    const result2 = await bookService.getNearbyBooks({
      latitude: '26.7288',
      longitude: '85.9260',
      radius: '30',
      limit: 5,
    });
    assert('Nearby works for Janakpur', result2.count > 0, `count=${result2.count}`);
  } catch (e) {
    assert('getNearbyBooks did not throw', false, e.message);
  }
  console.log('');

  // ── 5. getBookById ─────────────────────────────────────────────────────────
  console.log('  📖  getBookById (Book Details)');
  try {
    // Fetch a real book ID from DB
    const Book = require('../models/Book');
    const sampleBook = await Book.findOne({ seller: null }).lean();
    assert('Sample book found', !!sampleBook, sampleBook?._id?.toString());

    if (sampleBook) {
      const bookId = sampleBook._id.toString();
      const result = await bookService.getBookById(bookId);
      assert('Returns book object', !!result?.id);
      assert('title correct', result.title === sampleBook.title);
      assert('seller is null', result.seller === null);
      assert('location present', !!result.location, JSON.stringify(result.location));
      assert('rating is number', typeof result.rating === 'number');
      assert('price is number', typeof result.price === 'number');
      assert('grade field mapped', result.grade !== undefined);
      assert('subject field mapped', result.subject !== undefined);
    }

    // Invalid ID should throw
    try {
      await bookService.getBookById('invalid-id-123');
      assert('Invalid ID throws', false, 'should have thrown');
    } catch (err) {
      assert('Invalid ID throws AppError', err.statusCode === 400, `status=${err.statusCode}`);
    }
  } catch (e) {
    assert('getBookById did not throw', false, e.message);
  }
  console.log('');

  // ── 6. getSimilarBooks ─────────────────────────────────────────────────────
  console.log('  🔗  getSimilarBooks');
  try {
    const Book = require('../models/Book');
    const sampleBook = await Book.findOne({ seller: null }).lean();
    if (sampleBook) {
      const result = await bookService.getSimilarBooks(sampleBook._id.toString(), { limit: 5 });
      assert('Returns similar books', Array.isArray(result.books));
      assert('Has similarityScore', result.books[0]?.similarityScore !== undefined, `score=${result.books[0]?.similarityScore}`);
    }
  } catch (e) {
    assert('getSimilarBooks did not throw', false, e.message);
  }
  console.log('');

  // ── 7. Recommendations ─────────────────────────────────────────────────────
  console.log('  🤖  Recommendations');
  try {
    const result = await recommendationService.getRecommendations({
      q: 'mathematics',
      latitude: '27.7172',
      longitude: '85.3240',
      radius: '50',
      buyerGrade: 'Grade 11',
      limit: 5,
    });
    assert('Returns recommendations', Array.isArray(result.recommendations), `type=${typeof result.recommendations}`);
    assert('Has recommendations', result.count > 0, `count=${result.count}`);
    if (result.recommendations && result.recommendations[0]) {
      assert('Recommendation has finalScore', result.recommendations[0].scores?.finalScore !== undefined, `finalScore=${result.recommendations[0].scores?.finalScore}`);
    }
  } catch (e) {
    assert('getRecommendations did not throw', false, e.message);
  }
  console.log('');

  // ── 8. Data Integrity ──────────────────────────────────────────────────────
  console.log('  🔎  Data Integrity Checks');
  try {
    const Book = require('../models/Book');
    const total = await Book.countDocuments();
    assert('50000+ books in DB', total >= 50000, `total=${total}`);

    const withGeo = await Book.countDocuments({ 'location.coordinates': { $exists: true } });
    assert('All imported books have GeoJSON', withGeo >= 50000, `withGeo=${withGeo}`);

    const withSellerName = await Book.countDocuments({ sellerName: { $exists: true, $ne: null } });
    assert('sellerName preserved (50k)', withSellerName >= 50000, `withSellerName=${withSellerName}`);

    const withPrice = await Book.countDocuments({ price: { $exists: true } });
    assert('Price field exists', withPrice >= 50000, `withPrice=${withPrice}`);

    // Check condition enum values are valid
    const invalidCondition = await Book.countDocuments({
      condition: { $nin: ['new', 'like-new', 'good', 'fair', 'poor', null, undefined] },
    });
    assert('No invalid condition values', invalidCondition === 0, `invalid=${invalidCondition}`);

    // Check rating is 0-5
    const invalidRating = await Book.countDocuments({ rating: { $gt: 5 } });
    assert('All ratings ≤ 5', invalidRating === 0, `invalid=${invalidRating}`);

    // Verify lat/lon order in GeoJSON [lon, lat]
    const sampleGeo = await Book.findOne({ seller: null, 'location.coordinates': { $exists: true } }).lean();
    if (sampleGeo?.location?.coordinates) {
      const [lon, lat] = sampleGeo.location.coordinates;
      assert(
        'GeoJSON coordinates [lon, lat] in Nepal range',
        lon >= 80 && lon <= 89 && lat >= 26 && lat <= 29,
        `lon=${lon}, lat=${lat}`
      );
    }
  } catch (e) {
    assert('Data integrity checks did not throw', false, e.message);
  }
  console.log('');

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('  🎉  ALL CHECKS PASSED — Dataset fully integrated!');
  } else {
    console.log('  ⚠️   Some checks failed. Review above for details.');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('💥  Fatal:', err);
  process.exit(1);
});
