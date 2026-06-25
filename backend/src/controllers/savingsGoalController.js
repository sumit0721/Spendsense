const SavingsGoal = require('../models/SavingsGoal');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const getGoals = asyncHandler(async (req, res) => {
  const goals = await SavingsGoal.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, goals });
});

const createGoal = asyncHandler(async (req, res) => {
  const { name, targetAmount, targetDate } = req.body;
  if (!name || !targetAmount) {
    throw new AppError('Goal name and target amount are required', 400);
  }
  const goal = await SavingsGoal.create({
    user: req.user._id, name, targetAmount, targetDate, savedAmount: 0,
  });
  res.status(201).json({ success: true, goal });
});

// Adds (or sets) progress toward a goal. Uses a delta-add pattern by
// default (`amount` adds to current savedAmount) since that matches how
// a user actually thinks ("I put aside another ₹2000") rather than
// re-typing a running total every time.
const updateGoalProgress = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (typeof amount !== 'number') {
    throw new AppError('A numeric amount is required', 400);
  }
  const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new AppError('Goal not found', 404);

  const wasCompleted = goal.isCompleted;
  goal.savedAmount = Math.max(0, goal.savedAmount + amount);
  await goal.save();

  res.status(200).json({
    success: true,
    goal,
    justCompleted: !wasCompleted && goal.isCompleted, // frontend uses this to fire the notification
  });
});

const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new AppError('Goal not found', 404);
  res.status(200).json({ success: true });
});

module.exports = { getGoals, createGoal, updateGoalProgress, deleteGoal };
