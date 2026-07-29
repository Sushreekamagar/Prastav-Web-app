require('dotenv').config();
const mongoose = require('mongoose');
const recommendationService = require('../services/recommendationService');
const Book = require('../models/Book');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const sample = await Book.findOne().lean();

  const recs = await recommendationService.getRecommendations({
    q: 'business',
    latitude: 27.7172,
    longitude: 85.324,
    radius: 5,
    grade: 'class 10',
    page: 1,
    limit: 3,
  });

  const similar = await recommendationService.getSimilarRecommendations(sample._id, {
    latitude: 27.7172,
    longitude: 85.324,
    grade: sample.Grade,
    limit: 2,
  });

  const explain = await recommendationService.explainRecommendation(sample._id, {
    q: 'business',
    latitude: 27.7172,
    longitude: 85.324,
    grade: sample.Grade,
  });

  console.log('recommendations', recs.count, 'finalScore', recs.recommendations[0]?.scores?.finalScore);
  console.log('similar', similar.count);
  console.log('explain final', explain.explanation.finalScore);
  await mongoose.disconnect();
});
