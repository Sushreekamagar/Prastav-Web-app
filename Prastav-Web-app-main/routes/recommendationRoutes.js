const express = require('express');
const router = express.Router();

const {
  getRecommendations,
  getSimilarRecommendations,
  explainRecommendation,
} = require('../controllers/recommendationController');

const { protect } = require('../middleware/authMiddleware');

/**
 * Recommendation Routes — Module 4 Hybrid Engine
 *
 * JWT optional for browsing: protect enriches buyer grade/location from profile.
 * Query params (latitude, longitude, grade) override profile values.
 */

router.get('/', protect, getRecommendations);
router.get('/similar/:bookId', protect, getSimilarRecommendations);
router.get('/explain/:bookId', protect, explainRecommendation);

module.exports = router;
