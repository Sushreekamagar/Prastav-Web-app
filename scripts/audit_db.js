const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const books = db.collection('books');
  
  const withLocation = await books.countDocuments({ 'location.coordinates': { $exists: true } });
  const withSeller = await books.countDocuments({ seller: { $ne: null } });
  const withSellerName = await books.countDocuments({ sellerName: { $exists: true } });
  const withPrice = await books.countDocuments({ price: { $exists: true } });
  
  console.log('Total books:', await books.countDocuments());
  console.log('Books with location:', withLocation);
  console.log('Books with seller (non-null):', withSeller);
  console.log('Books with sellerName:', withSellerName);
  console.log('Books with price:', withPrice);
  
  const samples = await books.find({}).limit(5).toArray();
  const allKeys = new Set();
  samples.forEach(s => Object.keys(s).forEach(k => allKeys.add(k)));
  console.log('All field names in sample:', [...allKeys].join(', '));
  
  // Show a sample with all fields
  console.log('\nSample book (full):');
  console.log(JSON.stringify(samples[0], null, 2));
  
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
