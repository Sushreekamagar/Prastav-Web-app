const mongoose = require('mongoose');

/**
 * Book Model — matches the imported Prastav books dataset (50k records).
 *
 * Imported fields: book_id, title, author, genre, keywords, Grade, rating, condition, etc.
 * Marketplace fields (optional): seller, location, price, imageUrl — set when users list books.
 */
const bookSchema = new mongoose.Schema(
  {
    book_id: { type: Number },

    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },

    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },

    // Imported dataset uses "genre" — exposed as "subject" in API responses
    genre: {
      type: String,
      trim: true,
    },

    isbn: { type: Number },
    publish_year: { type: Number },

    // Book rating from dataset (0–5); used when seller is not linked
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    keywords: {
      type: String,
      trim: true,
      default: '',
    },

    condition: {
      type: String,
      enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    // Imported field name is capitalised "Grade"
    Grade: {
      type: String,
      trim: true,
    },

    Title_Length: { type: Number },
    Title_Word_Count: { type: Number },

    imageUrl: { type: String, default: null },
    price: { type: Number, default: 0, min: 0 },

    // Marketplace listing type — only set for user-created listings, not imported dataset books
    listingType: {
      type: String,
      enum: ['sell', 'donate', 'exchange'],
      default: null,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
    },

    isAvailable: { type: Boolean, default: true },
    isReported: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    strict: false, // allow extra fields from imported dataset
  }
);

bookSchema.index({ location: '2dsphere' });
bookSchema.index({ isAvailable: 1, isReported: 1 }); // Performance fix for base availability filters
bookSchema.index({ title: 'text', author: 'text', genre: 'text', keywords: 'text' });
bookSchema.index({ genre: 1, Grade: 1, condition: 1 });
bookSchema.index({ rating: -1 });
bookSchema.index({ publish_year: -1 });

module.exports = mongoose.model('Book', bookSchema);
