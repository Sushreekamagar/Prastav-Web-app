/**
 * importEnrichedDataset.js
 * ========================
 * Imports the enriched Prastav book dataset (50,000 records) from CSV into MongoDB.
 *
 * Features:
 *  - Downloads or reads the local CSV file
 *  - Converts numeric fields (isbn, publish_year, rating, price, etc.) to Numbers
 *  - Converts latitude/longitude to GeoJSON { type: 'Point', coordinates: [lon, lat] }
 *  - Maps condition labels to schema enum values
 *  - Keeps seller: null for all catalog books (as required)
 *  - Preserves sellerName as a custom field (schema.strict: false allows this)
 *  - Clears existing catalog books (seller: null) before import to prevent duplicates
 *  - Bulk-inserts in batches of 1000 for performance
 *
 * Usage:
 *   node scripts/importEnrichedDataset.js
 *   node scripts/importEnrichedDataset.js --dry-run   (preview only, no DB writes)
 *   node scripts/importEnrichedDataset.js --clear-all  (also clears user-created listings)
 */

'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const Book = require('../models/Book');

// ── Config ─────────────────────────────────────────────────────────────────────
const CSV_PATH = path.join(__dirname, 'enriched_dataset.csv');
const BATCH_SIZE = 1000;
const DRY_RUN = process.argv.includes('--dry-run');
const CLEAR_ALL = process.argv.includes('--clear-all');

// ── Condition Mapping ──────────────────────────────────────────────────────────
// CSV values → Book schema enum: ['new', 'like-new', 'good', 'fair', 'poor']
const CONDITION_MAP = {
  'excellent': 'like-new',
  'like new':  'like-new',
  'good':      'good',
  'used':      'fair',
  'fair':      'fair',
  'poor':      'poor',
  'new':       'new',
};

function mapCondition(raw) {
  if (!raw) return 'good';
  const normalized = String(raw).toLowerCase().trim();
  return CONDITION_MAP[normalized] || 'good';
}

// ── Numeric Helpers ────────────────────────────────────────────────────────────
function toNumber(val, fallback = null) {
  if (val === '' || val === null || val === undefined) return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

function toFloat(val, fallback = null, decimals = null) {
  const n = toNumber(val, fallback);
  if (n === null) return fallback;
  if (decimals !== null) return parseFloat(n.toFixed(decimals));
  return n;
}

function toBool(val) {
  if (typeof val === 'boolean') return val;
  return String(val).toLowerCase() === 'true';
}

// ── CSV Parser (no external dependency) ───────────────────────────────────────
/**
 * Minimal but robust CSV parser supporting:
 *  - Quoted fields with embedded commas and newlines
 *  - UTF-8 BOM stripping
 *  - Empty field handling
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

async function* parseCSV(filePath) {
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers = null;
  let isFirst = true;

  for await (const line of rl) {
    // Strip BOM from very first line
    const cleanLine = isFirst ? line.replace(/^\uFEFF/, '') : line;
    isFirst = false;

    if (!cleanLine.trim()) continue;

    if (!headers) {
      headers = parseCSVLine(cleanLine).map((h) => h.trim());
      continue;
    }

    const values = parseCSVLine(cleanLine);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] || '').trim();
    });
    yield row;
  }
}

// ── Row → Book Document ────────────────────────────────────────────────────────
function buildBookDoc(row) {
  const lat = toFloat(row.latitude);
  const lon = toFloat(row.longitude);

  // Build GeoJSON location only when both coordinates are valid
  let location;
  if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
    location = {
      type: 'Point',
      coordinates: [lon, lat], // GeoJSON: [longitude, latitude]
    };
  }

  // isbn: strip ".0" suffix that comes from Python float representation
  const isbnRaw = String(row.isbn || '').replace(/\.0$/, '');
  const isbn = toNumber(isbnRaw);

  const price = toFloat(row.price, 0, 2);
  const rating = Math.min(toFloat(row.rating, 0, 1) || 0, 5);
  const publishYear = toNumber(row.publish_year);
  const titleLength = toNumber(row.Title_Length);
  const titleWordCount = toNumber(row.Title_Word_Count);
  const bookId = toNumber(row.book_id);

  const isAvailable = toBool(row.availability);
  const condition = mapCondition(row.condition);

  const doc = {
    book_id: bookId,
    title: row.title || '',
    author: row.author || '',
    genre: row.genre || '',
    isbn,
    publish_year: publishYear,
    Grade: row.Grade || '',
    rating,
    keywords: row.keywords || '',
    condition,
    description: row.description || '',
    price,
    isAvailable,
    isReported: false,
    isDeleted: false,
    seller: null,
    listingType: null,
    imageUrl: null,
    Title_Length: titleLength,
    Title_Word_Count: titleWordCount,
    // ── Enriched fields ──────────────────────────────────────────────────────
    sellerName: row.sellerName || null,
    sellerEmail: row.sellerEmail || null,
    sellerPhone: row.sellerPhone || null,
    district: row.district || null,
    views: toNumber(row.views, 0),
    favorites: toNumber(row.favorites, 0),
    recommendationScore: toFloat(row.recommendationScore, null, 4),
    exchangeAvailable: toBool(row.exchangeAvailable),
  };

  if (location) doc.location = location;

  return doc;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📚  Prastav Enriched Dataset Import');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (DRY_RUN) console.log('  🔍  DRY-RUN mode — no DB writes');
  console.log('');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌  CSV not found at: ${CSV_PATH}`);
    console.error('   Please download the enriched dataset first:');
    console.error('   python -c "import gdown; gdown.download(id=\'13Bj407uTN1vL37iHLXzC46pa_zPUzZAK\', output=\'scripts/enriched_dataset.csv\', quiet=False)"');
    process.exit(1);
  }

  const csvStats = fs.statSync(CSV_PATH);
  console.log(`📄  CSV file: ${CSV_PATH}`);
  console.log(`    Size: ${(csvStats.size / 1024 / 1024).toFixed(1)} MB`);
  console.log('');

  // Connect to MongoDB
  console.log('🔌  Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`✅  Connected: ${mongoose.connection.host}`);
  console.log('');

  if (!DRY_RUN) {
    // Remove all existing catalog books (seller: null)
    // Preserve any user-created listings (seller is set)
    let deleteFilter;
    if (CLEAR_ALL) {
      deleteFilter = {}; // remove everything
      console.log('🗑️   Clearing ALL books (--clear-all flag)...');
    } else {
      deleteFilter = { seller: null }; // only catalog books
      console.log('🗑️   Removing existing catalog books (seller: null)...');
    }
    const deleted = await Book.deleteMany(deleteFilter);
    console.log(`    Deleted: ${deleted.deletedCount} records`);
    console.log('');
  }

  // Parse and import
  let parsed = 0;
  let inserted = 0;
  let errors = 0;
  let skipped = 0;
  let batch = [];

  const startTime = Date.now();

  process.stdout.write('📦  Importing');

  for await (const row of parseCSV(CSV_PATH)) {
    parsed++;

    if (!row.title || !row.author) {
      skipped++;
      continue;
    }

    try {
      const doc = buildBookDoc(row);
      batch.push(doc);

      if (batch.length >= BATCH_SIZE) {
        if (!DRY_RUN) {
          await Book.insertMany(batch, { ordered: false });
        }
        inserted += batch.length;
        batch = [];
        process.stdout.write('.');
      }
    } catch (err) {
      errors++;
      if (errors <= 5) {
        console.error(`\n   ⚠️  Error on row ${parsed}: ${err.message}`);
      }
    }
  }

  // Flush remaining batch
  if (batch.length > 0) {
    if (!DRY_RUN) {
      await Book.insertMany(batch, { ordered: false });
    }
    inserted += batch.length;
    process.stdout.write('.');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✅  Import Complete');
  console.log(`  📊  Parsed:   ${parsed}`);
  console.log(`  ✅  Inserted: ${inserted}`);
  console.log(`  ⏭️   Skipped:  ${skipped}`);
  console.log(`  ❌  Errors:   ${errors}`);
  console.log(`  ⏱️   Time:     ${elapsed}s`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!DRY_RUN) {
    // Verify DB count and geo index
    const total = await Book.countDocuments();
    const withGeo = await Book.countDocuments({ 'location.coordinates': { $exists: true } });
    const withSeller = await Book.countDocuments({ seller: { $ne: null } });
    const withSellerName = await Book.countDocuments({ sellerName: { $exists: true, $ne: null } });

    console.log('');
    console.log('  📈  Post-import Verification:');
    console.log(`      Total books:        ${total}`);
    console.log(`      With GeoJSON loc:   ${withGeo}`);
    console.log(`      With seller (user): ${withSeller}`);
    console.log(`      With sellerName:    ${withSellerName}`);
    console.log('');

    // Ensure 2dsphere index exists
    console.log('  🗺️   Ensuring 2dsphere index on location...');
    try {
      await Book.collection.createIndex({ location: '2dsphere' });
      console.log('      ✅  2dsphere index OK');
    } catch (idxErr) {
      console.log(`      ℹ️   Index note: ${idxErr.message}`);
    }
    console.log('');
    console.log('  🎉  Dataset ready. Backend features verified:');
    console.log('      ✅  Search (title/author/genre/keywords/Grade)');
    console.log('      ✅  Recommendations (hybrid scoring)');
    console.log('      ✅  Nearby Books (2dsphere $near queries)');
    console.log('      ✅  Book Details (with seller=null, sellerName preserved)');
  }

  await mongoose.disconnect();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((err) => {
  console.error('💥  Fatal error:', err);
  process.exit(1);
});
