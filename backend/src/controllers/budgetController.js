const { asyncHandler, AppError } = require('../middleware/errorHandler');
const Budget = require('../models/Budget');

const getBudget = asyncHandler(async (req, res) => {
  const date = new Date();
  const month = parseInt(req.query.month) || date.getMonth() + 1;
  const year = parseInt(req.query.year) || date.getFullYear();

  const budget = await Budget.findOne({ user: req.user._id, month, year });
  res.status(200).json({ success: true, budget });
});

const setBudget = asyncHandler(async (req, res) => {
  const { month, year, totalLimit, categoryLimits } = req.body;

  if (!month || !year || !totalLimit) {
    throw new AppError('Month, year, and totalLimit are required', 400);
  }

  let budget = await Budget.findOne({ user: req.user._id, month, year });

  if (budget) {
    budget.totalLimit = totalLimit;
    if (categoryLimits) {
      budget.categoryLimits = categoryLimits;
    }
    await budget.save();
  } else {
    budget = await Budget.create({
      user: req.user._id,
      month,
      year,
      totalLimit,
      categoryLimits: categoryLimits || {},
    });
  }

  res.status(200).json({ success: true, budget });
});

module.exports = {
  getBudget,
  setBudget,
};
