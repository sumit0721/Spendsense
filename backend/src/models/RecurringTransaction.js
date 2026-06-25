const mongoose = require('mongoose');

const recurringTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    merchant: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true },
    paymentMethod: { type: String, default: 'Other' },
    // Day of month this recurs on (1-28, capped to avoid Feb 30 issues)
    dayOfMonth: { type: Number, required: true, min: 1, max: 28 },
    isActive: { type: Boolean, default: true },
    // Tracks the last month/year this was auto-created, so the cron
    // job doesn't double-create within the same month if it runs more
    // than once on a given day.
    lastRunMonth: { type: Number },
    lastRunYear: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecurringTransaction', recurringTransactionSchema);
