const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Goal name is required'], trim: true, maxlength: 60 },
    targetAmount: { type: Number, required: true, min: [1, 'Target must be greater than zero'] },
    savedAmount: { type: Number, default: 0, min: 0 },
    contributions: [{
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      notes: { type: String, trim: true }
    }],
    targetDate: { type: Date },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Re-calculate savedAmount and mark complete automatically
savingsGoalSchema.pre('save', function (next) {
  if (this.contributions && this.contributions.length > 0) {
    this.savedAmount = this.contributions.reduce((acc, curr) => acc + curr.amount, 0);
  }
  this.isCompleted = this.savedAmount >= this.targetAmount;
  next();
});

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
