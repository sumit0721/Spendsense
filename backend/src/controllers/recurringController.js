const RecurringTransaction = require('../models/RecurringTransaction');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const getRecurring = asyncHandler(async (req, res) => {
  const recurring = await RecurringTransaction.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, recurring });
});

const createRecurring = asyncHandler(async (req, res) => {
  const { merchant, amount, category, paymentMethod, dayOfMonth } = req.body;
  if (!merchant || !amount || !category || !dayOfMonth) {
    throw new AppError('Merchant, amount, category, and dayOfMonth are required', 400);
  }
  const recurring = await RecurringTransaction.create({
    user: req.user._id, merchant, amount, category, paymentMethod, dayOfMonth,
  });
  res.status(201).json({ success: true, recurring });
});

const deleteRecurring = asyncHandler(async (req, res) => {
  const recurring = await RecurringTransaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!recurring) throw new AppError('Recurring transaction not found', 404);
  res.status(200).json({ success: true });
});

const updateRecurring = asyncHandler(async (req, res) => {
  const { merchant, amount, category, paymentMethod, dayOfMonth } = req.body;
  const recurring = await RecurringTransaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!recurring) throw new AppError('Recurring transaction not found', 404);

  if (merchant !== undefined) recurring.merchant = merchant;
  if (amount !== undefined) recurring.amount = amount;
  if (category !== undefined) recurring.category = category;
  if (paymentMethod !== undefined) recurring.paymentMethod = paymentMethod;
  if (dayOfMonth !== undefined) recurring.dayOfMonth = dayOfMonth;
  
  await recurring.save();
  res.status(200).json({ success: true, recurring });
});

module.exports = { getRecurring, createRecurring, deleteRecurring, updateRecurring };
