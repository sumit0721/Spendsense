const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    categoryLimits: {
      type: Map,
      of: Number,
      default: {},
    },
    totalLimit: {
      type: Number,
      required: [true, 'Total budget limit is required'],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Ensure one budget per user per month-year combination.
 */
budgetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
