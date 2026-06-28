const Tesseract = require('tesseract.js');
const multer = require('multer');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { uploadReceiptToS3 } = require('../utils/s3Client');

// Images only, processed in memory — never written to local disk, since
// platforms like Render/Vercel wipe local filesystem on redeploy, and
// writing financial-document images to disk at all is an unnecessary
// extra copy of sensitive data.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — phone photos can be large
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new AppError('Only image files are accepted for receipt scanning.', 400));
    }
    cb(null, true);
  },
}).single('receipt');

// Same keyword-lookup pattern already used for bank-import categorization
// (kept here independently since bank import was not implemented --
// this is a fresh, self-contained lookup table for receipts specifically).
const MERCHANT_KEYWORDS = {
  Groceries: ['dmart', 'bigbasket', 'reliance fresh', 'more', 'grocery', 'grocer'],
  Dining: ['restaurant', 'cafe', 'dominos', 'mcdonald', 'zomato', 'swiggy', 'kfc', 'pizza'],
  Health: ['pharmacy', 'apollo', 'medical', 'chemist', 'hospital', 'clinic'],
  Shopping: ['mart', 'store', 'mall', 'retail'],
  Travel: ['petrol', 'fuel', 'diesel'],
};

const guessCategory = (text) => {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(MERCHANT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return null; // null = let the user pick, do not guess wrong silently
};

/**
 * Extracts amount, date, and a merchant guess from raw OCR text using
 * regex only -- deliberately NOT an LLM call. A wrong regex match is
 * easy for a human to spot and correct on the review screen; adding a
 * 4th AI feature to parse what's usually a few short lines of text
 * would be disproportionate complexity for the accuracy gain.
 */
const parseReceiptText = (rawText) => {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  // Amount: look for "Total" line first (most reliable), fall back to
  // the largest ₹-prefixed number found anywhere in the text.
  let amount = null;
  const totalLineMatch = rawText.match(/total[:\s]*₹?\s?(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i);
  if (totalLineMatch) {
    amount = parseFloat(totalLineMatch[1].replace(/,/g, ''));
  } else {
    const allAmounts = [...rawText.matchAll(/₹\s?(\d+(?:,\d{3})*(?:\.\d{1,2})?)/g)]
      .map((m) => parseFloat(m[1].replace(/,/g, '')));
    if (allAmounts.length > 0) amount = Math.max(...allAmounts);
  }

  // Date: common Indian receipt formats (DD/MM/YYYY, DD-MM-YYYY)
  let date = null;
  const dateRegex = new RegExp("(\\d{1,2})[-/](\\d{1,2})[-/](\\d{2,4})");
  const dateMatch = rawText.match(dateRegex);
  if (dateMatch) {
    let [, d, m, y] = dateMatch;
    if (y.length === 2) y = `20${y}`;
    const parsed = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (!isNaN(parsed.getTime())) date = parsed.toISOString().split('T')[0];
  }

  // Merchant: first non-empty line is the most common convention on
  // Indian retail receipts (store name printed at the top).
  const merchant = lines[0] || null;

  const category = guessCategory(rawText);

  return {
    amount,
    date,
    merchant,
    category,
    rawText, // returned for debugging/manual correction reference, not stored long-term
    // Surfaces to the frontend exactly which fields need the user's
    // attention, rather than presenting a confident-looking guess that
    // might be silently wrong.
    needsReview: !amount || !date || !merchant,
  };
};

/**
 * @route   POST /api/receipt/scan
 * @desc    Upload a receipt image, OCR it, and return a PARSED PREVIEW.
 *          Nothing is saved as a transaction here -- the user must review
 *          and submit via the normal createTransaction endpoint afterward.
 * @access  Private
 */
const scanReceipt = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No image uploaded', 400);
  }

  // Upload to S3 first -- if this fails, we haven't wasted OCR time, and
  // we have a record of the attempt either way.
  let s3Key = null;
  try {
    s3Key = await uploadReceiptToS3(req.file.buffer, req.file.mimetype, req.user._id);
  } catch (err) {
    console.error('[S3 Upload Error]:', err.message);
    // Non-fatal: OCR can still proceed even if S3 storage fails. The
    // receipt just won't have a stored image reference in that case.
  }

  let ocrText;
  try {
    const result = await Tesseract.recognize(req.file.buffer, 'eng');
    ocrText = result.data.text;
  } catch (err) {
    console.error('[OCR Error]:', err.message);
    throw new AppError('Could not read text from this image. Try a clearer photo.', 422);
  }

  if (!ocrText || ocrText.trim().length < 5) {
    throw new AppError('No readable text found in this image. Try a clearer, well-lit photo.', 422);
  }

  const parsed = parseReceiptText(ocrText);

  res.status(200).json({
    success: true,
    s3Key,
    ...parsed,
  });
});

module.exports = { upload, scanReceipt };
