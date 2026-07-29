/**
 * Haversine Service
 * Computes great-circle distance between two GPS coordinates.
 * Used for fine-grained proximity filtering after MongoDB $near coarse filter.
 * Error margin: ~0.5% (2.5–50m at campus scale) — acceptable per SRS N8.
 */
 
const toRadians = (deg) => (deg * Math.PI) / 180;
 
/**
 * Calculate distance between two lat/lon points
 * @returns distance in kilometers
 */
const calculateHaversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
 
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
 
module.exports = { calculateHaversine };
 