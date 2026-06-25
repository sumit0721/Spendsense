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
  const { amount, date, notes } = req.body;
  if (typeof amount !== 'number') {
    throw new AppError('A numeric amount is required', 400);
  }
  const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new AppError('Goal not found', 404);

  const wasCompleted = goal.isCompleted;
  
  // Backwards compatibility: If there is a savedAmount but no contributions, convert it first
  if (goal.savedAmount > 0 && goal.contributions.length === 0) {
    goal.contributions.push({ amount: goal.savedAmount, notes: 'Initial Balance', date: goal.createdAt });
  }

  goal.contributions.push({ amount, date: date || new Date(), notes });
  await goal.save();

  res.status(200).json({
    success: true,
    goal,
    justCompleted: !wasCompleted && goal.isCompleted,
  });
});

const deleteGoalContribution = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new AppError('Goal not found', 404);

  goal.contributions = goal.contributions.filter(c => c._id.toString() !== req.params.contributionId);
  await goal.save();

  res.status(200).json({ success: true, goal });
});

const editGoalContribution = asyncHandler(async (req, res) => {
  const { amount, date, notes } = req.body;
  const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new AppError('Goal not found', 404);

  const contribution = goal.contributions.id(req.params.contributionId);
  if (!contribution) throw new AppError('Contribution not found', 404);

  if (amount !== undefined) contribution.amount = amount;
  if (date !== undefined) contribution.date = date;
  if (notes !== undefined) contribution.notes = notes;

  await goal.save();
  res.status(200).json({ success: true, goal });
});

const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new AppError('Goal not found', 404);
  res.status(200).json({ success: true });
});

const updateGoal = asyncHandler(async (req, res) => {
  const { name, targetAmount, targetDate } = req.body;
  const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new AppError('Goal not found', 404);

  if (name !== undefined) goal.name = name;
  if (targetAmount !== undefined) goal.targetAmount = targetAmount;
  if (targetDate !== undefined) goal.targetDate = targetDate;
  await goal.save();

  res.status(200).json({ success: true, goal });
});

module.exports = { getGoals, createGoal, updateGoalProgress, deleteGoal, updateGoal, deleteGoalContribution, editGoalContribution };
