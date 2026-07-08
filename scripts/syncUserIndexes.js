/**
 * One-time fix: drop stale eduEmail index left from the old User schema.
 * Run: node scripts/syncUserIndexes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const syncUserIndexes = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const collection = User.collection;

  const indexes = await collection.indexes();
  const staleIndex = indexes.find((idx) => idx.name === 'eduEmail_1');

  if (staleIndex) {
    await collection.dropIndex('eduEmail_1');
    console.log('✅ Dropped stale index: eduEmail_1');
  } else {
    console.log('ℹ️  No stale eduEmail_1 index found.');
  }

  await User.syncIndexes();
  console.log('✅ User indexes synced:', (await collection.indexes()).map((i) => i.name).join(', '));

  await mongoose.disconnect();
};

syncUserIndexes().catch((err) => {
  console.error('❌ Index sync failed:', err.message);
  process.exit(1);
});
