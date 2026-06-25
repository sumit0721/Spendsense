const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'Rent', 'Groceries', 'Dining', 'Subscriptions', 'Travel',
  'Education', 'Entertainment', 'Utilities', 'Shopping', 'Health', 'Other',
];

const INCOME_CATEGORIES = ['Salary', 'Freelancing', 'Business', 'Other'];

const PAYMENT_METHODS = ['UPI', 'Cash', 'Debit Card', 'Credit Card', 'Net Banking', 'Other'];

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    merchant: { type: String, required: [true, 'Merchant name is required'], trim: true },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    type: {
      type: String,
      enum: { values: ['income', 'expense'], message: '{VALUE} must be income or expense' },
      required: [true, 'Transaction type is required'],
      default: 'expense',
    },
    category: { type: String, required: [true, 'Category is required'] },
    paymentMethod: {
      type: String,
      enum: { values: PAYMENT_METHODS, message: '{VALUE} is not a supported payment method' },
      default: 'Other',
    },
    date: { type: Date, required: [true, 'Transaction date is required'], default: Date.now },
    notes: { type: String, trim: true, maxlength: [200, 'Notes cannot exceed 200 characters'] },
    isAnomaly: { type: Boolean, default: false },
    source: { type: String, enum: ['manual', 'recurring'], default: 'manual' },
  },
  { timestamps: true }
);

transactionSchema.pre('validate', function (next) {
  const validList = this.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!validList.includes(this.category)) {
    this.invalidate('category', `${this.category} is not valid for type ${this.type}`);
  }
  next();
});

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
module.exports.INCOME_CATEGORIES = INCOME_CATEGORIES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
