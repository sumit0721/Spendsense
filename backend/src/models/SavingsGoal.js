const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Goal name is required'], trim: true, maxlength: 60 },
    targetAmount: { type: Number, required: true, min: [1, 'Target must be greater than zero'] },
    savedAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Mark complete automatically when saved reaches target — read by the
// notification logic to fire a "Goal completed" notification.
savingsGoalSchema.pre('save', function (next) {
  if (this.savedAmount >= this.targetAmount) this.isCompleted = true;
  next();
});

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
