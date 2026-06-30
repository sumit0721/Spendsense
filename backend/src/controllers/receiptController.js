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
  Utilities: ['recharge', 'airtel', 'jio', 'vi ', 'vodafone', 'electricity', 'broadband', 'wifi bill', 'dth'],
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

  // --- AMOUNT ---
  let amount = null;
  const totalLineMatch = rawText.match(/total[:\s]*₹?\s?(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i);
  if (totalLineMatch) {
    amount = parseFloat(totalLineMatch[1].replace(/,/g, ''));
  } else {
    const rupeeAmounts = [...rawText.matchAll(/₹\s?(\d+(?:,\d{3})*(?:\.\d{1,2})?)/g)]
      .map((m) => parseFloat(m[1].replace(/,/g, '')));
    if (rupeeAmounts.length > 0) amount = Math.max(...rupeeAmounts);
  }

  if (amount === null) {
    const decimalAmounts = [...rawText.matchAll(/\b(\d{1,6}\.\d{2})\b/g)]
      .map((m) => parseFloat(m[1]));
    if (decimalAmounts.length > 0) {
      const successLine = lines.find((l) => /success|paid|amount/i.test(l));
      const successLineIdx = successLine ? lines.indexOf(successLine) : -1;
      if (successLineIdx !== -1 && successLineIdx + 1 < lines.length) {
        const nearbyMatch = lines[successLineIdx + 1].match(/(\d{1,6}\.\d{2})/);
        if (nearbyMatch) amount = parseFloat(nearbyMatch[1]);
      }
      if (amount === null) amount = Math.max(...decimalAmounts);
    }
  }

  // --- DATE ---
  let date = null;
  const numericDateMatch = rawText.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (numericDateMatch) {
    let [, d, m, y] = numericDateMatch;
    if (y.length === 2) y = `20${y}`;
    const parsed = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (!isNaN(parsed.getTime())) date = parsed.toISOString().split('T')[0];
  } else {
    const monthNames = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec[a-z]*';
    const writtenDateMatch = rawText.match(
      new RegExp(`(\\d{1,2})\\s+(${monthNames})\\s+(\\d{4})`, 'i')
    );
    if (writtenDateMatch) {
      const [, d, monthStr, y] = writtenDateMatch;
      const parsed = new Date(`${d} ${monthStr} ${y}`);
      if (!isNaN(parsed.getTime())) date = parsed.toISOString().split('T')[0];
    }
  }

  // --- MERCHANT ---
  let merchant = null;
  const labeledMatch = rawText.match(/(?:for|paid\s*to|to|merchant)\s*:\s*(.+)/i);
  if (labeledMatch) {
    merchant = labeledMatch[1].split('\n')[0].trim().slice(0, 80);
  }
  if (!merchant) {
    const brandWords = ['paytm', 'gpay', 'google pay', 'phonepe', 'amazon pay', 'order successful', 'payment successful'];
    const firstRealLine = lines.find((l) => !brandWords.some((b) => l.toLowerCase().includes(b)));
    merchant = firstRealLine || lines[0] || null;
  }

  const category = guessCategory(rawText);

  return {
    amount,
    date,
    merchant,
    category,
    rawText,
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
