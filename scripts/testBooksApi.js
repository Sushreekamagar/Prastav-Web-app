require('dotenv').config();
const mongoose = require('mongoose');
const bookService = require('../services/bookService');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const all = await bookService.getAllBooks({ page: 1, limit: 2 });
  const search = await bookService.searchBooks({ q: 'business', limit: 2 });
  const filter = await bookService.filterBooks({ subject: 'business', condition: 'new', limit: 2 });
  const bookId = all.books[0]?.id;
  const similar = bookId ? await bookService.getSimilarBooks(bookId, { limit: 2 }) : null;
  const nearby = await bookService.getNearbyBooks({ latitude: 27.7172, longitude: 85.324, limit: 2 });

  console.log('GET /books', all.count, 'of', all.total);
  console.log('GET /search', search.count);
  console.log('GET /filter', filter.count);
  console.log('GET /similar', similar?.count);
  console.log('GET /nearby geoAvailable', nearby.geoAvailable);
  await mongoose.disconnect();
});
