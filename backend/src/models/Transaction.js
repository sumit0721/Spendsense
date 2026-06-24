const mongoose = require('mongoose');

const CATEGORIES = [
  'Rent',
  'Groceries',
  'Dining',
  'Subscriptions',
  'Travel',
  'Education',
  'Entertainment',
  'Utilities',
  'Shopping',
  'Health',
  'Other',
];

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    merchant: {
      type: String,
      required: [true, 'Merchant name is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a supported category',
      },
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters'],
    },
    isAnomaly: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compound index for efficient paginated queries:
 * Most common query is "all transactions for a user, sorted by date descending"
 */
transactionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.CATEGORIES = CATEGORIES;
