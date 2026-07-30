require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  await mongoose.connect(process.env.MONGO_URI);
  const newPassword = await bcrypt.hash('Admin@1234', 10);
  const result = await mongoose.connection.collection('users').updateOne(
    { email: 'admin@prastav.com' },
    { $set: { password: newPassword } }
  );
  if (result.modifiedCount === 1) {
    console.log('\n✅ Admin password reset to: Admin@1234\n');
  } else {
    console.log('\n⚠️  No update made (maybe password was already set)\n');
  }
  await mongoose.disconnect();
}

resetAdminPassword().catch(console.error);
