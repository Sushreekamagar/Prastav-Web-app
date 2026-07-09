const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Model — stores student accounts for the Prastav marketplace.
 * Schema only; all business logic lives in authService.js.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: 'Please provide a valid email address',
      },
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      default: 'buyer',
    },

    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },

    isReported: {
      type: Boolean,
      default: false,
    },

    profileImage: {
      type: String,
      default: null,
    },

    grade: {
      type: String,
      trim: true,
      default: null,
    },

    // GeoJSON Point — used later for nearby books & Haversine distance
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    reputationScore: {
      type: Number,
      default: 3.0,
      min: 0,
      max: 5,
    },

    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },

    esewaNumber: {
      type: String,
      trim: true,
      default: null,
    },

    khaltiNumber: {
      type: String,
      trim: true,
      default: null,
    },

    esewaQR: {
      type: String,
      default: null,
    },

    khaltiQR: {
      type: String,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
      select: false,
    },

    otpExpiry: {
      type: Date,
      select: false,
    },

    // Brute-force login protection
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// 2dsphere index — required for MongoDB geospatial queries
userSchema.index({ location: '2dsphere' });

// Hash password before saving (only when password field is modified)
// Note: async hooks must NOT use next() — Mongoose 9 uses promises for async middleware
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare plain-text password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is temporarily locked after failed login attempts
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

module.exports = mongoose.model('User', userSchema);
