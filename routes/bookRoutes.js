const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/bookController');

const { protect } = require('../middleware/authMiddleware');
const { uploadBookImage } = require('../middleware/uploadMiddleware');

/**
 * Book Routes — specific paths MUST come before /:id
 * Public read endpoints + protected seller actions
 */

router.get('/', getAllBooks);
router.get('/search', searchBooks);
router.get('/filter', filterBooks);
router.get('/nearby', getNearbyBooks);
router.get('/similar/:id', getSimilarBooks);

router.get('/my-listings', protect, getMyListings);
router.post('/', protect, uploadBookImage.single('image'), createBook);

router.get('/:id', getBook);
router.get('/:id/details', getBookDetails);
router.put('/:id', protect, updateBook);
router.delete('/:id', protect, deleteBook);
router.post('/:id/report', protect, reportBook);

module.exports = router;
