require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const col = mongoose.connection.collection('books');
  const withLoc = await col.countDocuments({ location: { $exists: true } });
  const withSeller = await col.countDocuments({ seller: { $exists: true } });
  const withSubject = await col.countDocuments({ subject: { $exists: true } });
  const withGenre = await col.countDocuments({ genre: { $exists: true } });
  console.log({ withLoc, withSeller, withSubject, withGenre, total: await col.countDocuments() });
  await mongoose.disconnect();
});
