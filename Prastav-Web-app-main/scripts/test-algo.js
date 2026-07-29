const assert = require('assert');
const Book = require('../models/Book');
const recommendationService = require('../services/recommendationService');

let mockBooks = [];
Book.find = () => {
  return {
    select: () => ({
      populate: () => ({
        sort: () => ({
          limit: () => ({
            lean: async () => mockBooks
          })
        })
      })
    })
  };
};

const runTests = async () => {
  console.log("Running backend recommendation tests...\n");

  // Base book template
  const createBook = (id, title, grade, lat, lng, repScore) => ({
    _id: id,
    book_id: id,
    title: title,
    author: "Author " + id,
    genre: "Science",
    keywords: "science physics space",
    Grade: grade,
    rating: 4.0,
    seller: {
      _id: "seller_" + id,
      name: "Seller " + id,
      reputationScore: repScore
    },
    location: {
      type: "Point",
      coordinates: [lng, lat]
    }
  });

  const centerLat = 27.7172;
  const centerLng = 85.3240;

  // Book 1: Exact match, same grade, within 5km, high rep
  const b1 = createBook(1, "Advanced Physics", "Grade 12", centerLat + 0.01, centerLng, 5.0);
  // Book 2: Keyword match, different grade, within 5km, lower rep
  const b2 = createBook(2, "Physics Fundamentals", "Grade 11", centerLat + 0.02, centerLng, 3.0);
  // Book 3: Exact title, same grade, outside 5km (distance score should be 0)
  const b3 = createBook(3, "Advanced Physics", "Grade 12", centerLat + 0.5, centerLng, 5.0);
  // Book 4: Empty search test (should be recommended by proximity and rep)
  const b4 = createBook(4, "Random Chemistry", "Grade 12", centerLat + 0.01, centerLng, 4.0);
  // Book 5: Duplicate score cases (same everything)
  const b5 = createBook(5, "Advanced Physics", "Grade 12", centerLat + 0.01, centerLng, 5.0);
  // Book 6: No location (missing coords)
  const b6 = createBook(6, "Missing Loc Physics", "Grade 12", null, null, 4.0);
  b6.location = undefined;

  mockBooks = [b1, b2, b3, b4, b5, b6];

  const buyerOptions = {
    q: "Advanced Physics",
    latitude: centerLat,
    longitude: centerLng,
    grade: "Grade 12",
    radius: 5
  };

  try {
    // Test 1: Full Search (Exact title match, Grade match, inside/outside 5km)
    let res = await recommendationService.getRecommendations(buyerOptions);
    let recs = res.recommendations;
    
    assert(recs.length > 0, "Should return recommendations");
    console.log("Test 1 Passed: Returns recommendations");

    // Check Sorting by Grade Match First
    // b1, b3, b4, b5, b6 are Grade 12 (exact match -> gradeScore 1)
    // b2 is Grade 11 (adjacent match -> gradeScore 0.6)
    // b2 must be last among them.
    const lastRec = recs[recs.length - 1];
    assert(lastRec.id === 2, "Grade 11 should be ranked lowest because Grade Match is highest priority");
    console.log("Test 2 Passed: Grade matching sorting works (highest priority)");

    // Books outside 5km -> excluded
    const b3Rec = recs.find(r => r.id === 3);
    assert(b3Rec === undefined, "Book outside 5km should be excluded");
    console.log("Test 3 Passed: Outside 5km are properly excluded");

    // Duplicate score cases: b1 and b5
    const b1Rec = recs.find(r => r.id === 1);
    const b5Rec = recs.find(r => r.id === 5);
    assert(b1Rec.scores.finalScore === b5Rec.scores.finalScore, "Duplicate books should have same final score");
    console.log("Test 4 Passed: Duplicate scores handled stably");

    // Empty search
    let emptyRes = await recommendationService.getRecommendations({ ...buyerOptions, q: "" });
    assert(emptyRes.recommendations.length > 0, "Empty search should return recommendations");
    assert(emptyRes.recommendations[0].scores.bookSimilarity === 0.5, "Empty search should give neutral content score");
    console.log("Test 5 Passed: Empty search handled correctly");

    // Reputation score verification
    assert(b1Rec.scores.reputationScore === 1.0, "Reputation 5.0 -> 1.0 score");
    const b2Rec = recs.find(r => r.id === 2);
    assert(b2Rec.scores.reputationScore === 0.6, "Reputation 3.0 -> 0.6 score");
    console.log("Test 6 Passed: Reputation normalized correctly");

    // Top 5 limit check
    assert(emptyRes.recommendations.length === 5, "Should return top 5 recommendations");
    console.log("Test 7 Passed: Returns exactly top 5 recommendations");

    console.log("\n✅ All automated tests passed successfully!");
  } catch (err) {
    console.error("❌ Test failed:", err.message);
    process.exit(1);
  }
};

runTests();
