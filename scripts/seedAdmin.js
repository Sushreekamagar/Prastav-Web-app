require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = 'admin@prastav.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = new User({
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      status: 'active'
    });

    // Save directly without triggering pre-save hook that hashes again
    // Wait, pre-save hook says: if (!this.isModified('password')) return; this.password = await bcrypt.hash(this.password, 10);
    // If I hash it manually here, the pre-save hook will hash it AGAIN because password is modified.
    // Let's pass plain text and let the hook hash it.
    
    admin.password = 'admin123';
    
    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@prastav.com');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
