const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('../utils/AppError');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

const SUBFOLDERS = ['profiles', 'esewa-qr', 'khalti-qr', 'books', 'payment-proof'];

SUBFOLDERS.forEach((folder) => {
  const dir = path.join(UPLOAD_ROOT, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const allowedImage = /jpeg|jpg|png|webp/;

const fileFilter = (req, file, cb) => {
  const valid =
    allowedImage.test(path.extname(file.originalname).toLowerCase()) &&
    allowedImage.test(file.mimetype);

  if (valid) cb(null, true);
  else cb(new AppError('Only JPEG, PNG, and WebP images are allowed.', 400), false);
};

/**
 * createUpload — Multer instance for a specific upload folder and filename prefix.
 */
const createUpload = (subfolder, prefix) =>
  multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, path.join(UPLOAD_ROOT, subfolder)),
      filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${prefix}-${unique}${path.extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
  });

const uploadProfileImage = createUpload('profiles', 'profile');
const uploadEsewaQR = createUpload('esewa-qr', 'esewa');
const uploadKhaltiQR = createUpload('khalti-qr', 'khalti');
const uploadBookImage = createUpload('books', 'book');
const uploadPaymentProof = createUpload('payment-proof', 'proof');

/**
 * handleMulterError — Converts Multer errors into JSON responses.
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('Image must be smaller than 5MB.', 400));
    }
    return next(new AppError(err.message, 400));
  }
  next(err);
};

module.exports = {
  uploadProfileImage,
  uploadEsewaQR,
  uploadKhaltiQR,
  uploadBookImage,
  uploadPaymentProof,
  handleMulterError,
};
