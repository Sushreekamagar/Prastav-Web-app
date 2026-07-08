const { calculateHaversine } = require('./haversineService');
 
/**
 * Content similarity — keyword match between query and book fields
 * Returns 0.0 to 1.0
 */
const calculateSimilarity = (query, title = '', subject = '', author = '') => {
  if (!query || query.trim() === '') return 0.5; // neutral if no query
  const words = query.toLowerCase().split(/\s+/);
  const bookText = `${title} ${subject} ${author}`.toLowerCase();
  const matches = words.filter((w) => bookText.includes(w)).length;
  return matches / words.length;
};
 
/**
 * Hybrid Recommendation Engine
 *
 * Weights (from capstone Algorithm 2):
 *   Content similarity  → 50%
 *   Spatial proximity   → 30%
 *   Trust/reputation    → 20%
 *
 * @param {Array}  books       — Raw books from MongoDB (populated with seller)
 * @param {string} userQuery   — Search keyword string
 * @param {Object} userLoc     — { lat, lon }
 * @param {number} maxKm       — Radius limit (default 10km)
 * @returns {Array} Ranked books with distance and scores attached
 */
const getHybridRecommendations = (books, userQuery, userLoc, maxKm = 10) => {
  const { lat, lon } = userLoc;
 
  const scored = books
    .map((book) => {
      const b = book.toObject ? book.toObject() : { ...book };
 
      // 1. Content Score
      const contentScore = calculateSimilarity(
        userQuery,
        b.title,
        b.subject,
        b.author
      );
 
      // 2. Spatial Score — proximity decay (closer = higher)
      const [bookLon, bookLat] = b.location.coordinates;
      const distanceKm = calculateHaversine(lat, lon, bookLat, bookLon);
      const spatialScore = 1 / (1 + distanceKm);
 
      // 3. Trust Score — seller reputation normalised 0–1
      const rep = b.seller?.reputationScore ?? 3.0;
      const trustScore = rep / 5;
 
      // 4. Aggregate
      const finalRank =
        contentScore * 0.5 + spatialScore * 0.3 + trustScore * 0.2;
 
      return {
        ...b,
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        scores: {
          content: parseFloat(contentScore.toFixed(3)),
          spatial: parseFloat(spatialScore.toFixed(3)),
          trust: parseFloat(trustScore.toFixed(3)),
          final: parseFloat(finalRank.toFixed(3)),
        },
        finalRank,
      };
    })
    .filter((b) => b.distanceKm <= maxKm)
    .sort((a, b) => b.finalRank - a.finalRank);
 
  return scored;
};
 
module.exports = { getHybridRecommendations };