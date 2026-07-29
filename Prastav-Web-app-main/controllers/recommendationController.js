const asyncHandler = require('../utils/asyncHandler');
const recommendationService = require('../services/recommendationService');

/**
 * Recommendation Controller — HTTP layer only.
 * Passes buyer context from JWT user + query parameters to the service.
 */

const buildOptions = (req) => ({
  q: req.query.q,
  latitude: req.query.latitude,
  longitude: req.query.longitude,
  radius: req.query.radius,
  page: req.query.page,
  limit: req.query.limit,
  buyerGrade: req.query.grade || req.user?.grade,
  userLocation: req.user?.location,
});

// GET /api/recommendations
const getRecommendations = asyncHandler(async (req, res, next) => {
  const result = await recommendationService.getRecommendations(buildOptions(req));

  res.status(200).json({ success: true, ...result });
});

// GET /api/recommendations/similar/:bookId
const getSimilarRecommendations = asyncHandler(async (req, res, next) => {
  const result = await recommendationService.getSimilarRecommendations(
    req.params.bookId,
    buildOptions(req)
  );

  res.status(200).json({ success: true, ...result });
});

// GET /api/recommendations/explain/:bookId
const explainRecommendation = asyncHandler(async (req, res, next) => {
  const result = await recommendationService.explainRecommendation(
    req.params.bookId,
    buildOptions(req)
  );

  res.status(200).json({ success: true, ...result });
});

module.exports = {
  getRecommendations,
  getSimilarRecommendations,
  explainRecommendation,
};
