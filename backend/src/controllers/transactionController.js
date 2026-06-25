const Transaction = require('../models/Transaction');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/transactions
 * @desc    Get paginated transactions for the authenticated user
 * @access  Private
 *
 * Query params:
 *   page   — page number (default: 1)
 *   limit  — items per page (default: 10, max: 50)
 *   category — filter by category (optional)
 *   sort   — sort field (default: -date)
 */
const getTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  // Build filter
  const filter = { user: req.user._id };
  if (req.query.category) {
    filter.category = req.query.category;
  }

  // Date range filter — both bounds optional, independently usable.
  // Invalid date strings are silently ignored rather than crashing the
  // request, since this comes from user-controlled query params.
  if (req.query.startDate || req.query.endDate) {
    filter.date = {};
    if (req.query.startDate) {
      const start = new Date(req.query.startDate);
      if (!isNaN(start.getTime())) filter.date.$gte = start;
    }
    if (req.query.endDate) {
      const end = new Date(req.query.endDate);
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999); // include the full end day
        filter.date.$lte = end;
      }
    }
    if (Object.keys(filter.date).length === 0) delete filter.date;
  }

  // Amount range filter — same optional-both-bounds pattern.
  if (req.query.minAmount || req.query.maxAmount) {
    filter.amount = {};
    const min = parseFloat(req.query.minAmount);
    const max = parseFloat(req.query.maxAmount);
    if (!isNaN(min)) filter.amount.$gte = min;
    if (!isNaN(max)) filter.amount.$lte = max;
    if (Object.keys(filter.amount).length === 0) delete filter.amount;
  }

  let sortOption = { date: -1 };
  if (req.query.sort) {
    if (req.query.sort === 'date') sortOption = { date: 1 };
    else if (req.query.sort === '-amount') sortOption = { amount: -1 };
    else if (req.query.sort === 'amount') sortOption = { amount: 1 };
  }

  const [transactions, totalCount] = await Promise.all([
    Transaction.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  res.status(200).json({
    success: true,
    transactions,
    page,
    limit,
    totalPages,
    totalCount,
  });
});

/**
 * Helper to calculate if a transaction amount is an anomaly.
 * An anomaly is defined as deviating by more than 2 standard deviations
 * from the historical mean for the given user and category.
 * Requires at least 5 data points to establish a baseline.
 */
const checkAnomaly = async (userId, category, amount) => {
  const history = await Transaction.find({
    user: userId,
    category: category
  }).select('amount').lean();

  // Guard clause: Require at least N = 5 data points to compute baseline statistics
  if (history.length < 5) {
    return false;
  }

  const amounts = history.map(t => t.amount);
  const n = amounts.length;

  const sum = amounts.reduce((acc, val) => acc + val, 0);
  const mean = sum / n;

  const sqDiffSum = amounts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const calculatedStdDev = Math.sqrt(sqDiffSum / n);

  // Apply a minimum standard deviation floor ($5) to avoid infinite/volatile Z-scores in low-variance categories
  const MIN_STD_DEV = 5.0;
  const stdDev = Math.max(calculatedStdDev, MIN_STD_DEV);

  const zScore = Math.abs(amount - mean) / stdDev;

  return zScore > 2;
};

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction for the authenticated user
 * @access  Private
 */
const createTransaction = asyncHandler(async (req, res) => {
  const { merchant, amount, category, date, notes, type, paymentMethod } = req.body;

  if (!merchant || amount === undefined || !category || !type) {
    throw new AppError('Merchant, amount, category, and type (income/expense) are required', 400);
  }
  if (!['income', 'expense'].includes(type)) {
    throw new AppError('Type must be income or expense', 400);
  }

  // Anomaly detection only applies to expenses — an unusually large
  // income deposit isn't a spending anomaly, it's just good news.
  const isAnomaly = type === 'expense' ? await checkAnomaly(req.user._id, category, amount) : false;

  const transaction = await Transaction.create({
    user: req.user._id,
    merchant,
    amount,
    type,
    category,
    paymentMethod: paymentMethod || 'Other',
    date: date || Date.now(),
    notes,
    isAnomaly,
  });

  res.status(201).json({ success: true, transaction });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }
  res.status(200).json({ success: true });
});

const getTransactionStats = asyncHandler(async (req, res) => {
  const days = Math.max(1, parseInt(req.query.days, 10) || 90);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Time boundaries for Month-over-Month comparisons
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Previous month boundary logic
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  
  // Robust month-to-date calculation to avoid calendar mismatch (e.g., comparing 23 days of current month to 31 of previous)
  const daysInPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const prevMonthDay = Math.min(now.getDate(), daysInPrevMonth);
  const prevMonthEndRelative = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    prevMonthDay,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  );

  // Run aggregation pipelines in parallel
  const [
    categoryTotals,
    topMerchants,
    currentMonthSpendData,
    prevMonthSpendData,
    prevMonthFullSpendData
  ] = await Promise.all([
    // 1. Category Totals for requested timeframe
    Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate },
          type: { $ne: 'income' }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      {
        $project: {
          category: '$_id',
          total: { $round: ['$total', 2] },
          _id: 0
        }
      },
      {
        $sort: { total: -1 }
      }
    ]),

    // 2. Top Merchants for requested timeframe
    Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate },
          type: { $ne: 'income' }
        }
      },
      {
        $group: {
          _id: '$merchant',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          merchant: '$_id',
          total: { $round: ['$total', 2] },
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 5
      }
    ]),

    // 3. Current Month Total Spend
    Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: currentMonthStart },
          type: { $ne: 'income' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]),

    // 4. Previous Month (Month-To-Date relative) Spend
    Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: prevMonthStart, $lte: prevMonthEndRelative },
          type: { $ne: 'income' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]),

    // 5. Previous Month Full Spend
    Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: prevMonthStart, $lte: prevMonthEnd },
          type: { $ne: 'income' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ])
  ]);

  const currentMonthTotal = currentMonthSpendData[0]?.total || 0;
  const prevMonthTotalRelative = prevMonthSpendData[0]?.total || 0;
  const prevMonthTotalFull = prevMonthFullSpendData[0]?.total || 0;

  // Calculate Month-over-Month delta percentage
  let momDeltaPercentage = 0;
  if (prevMonthTotalRelative > 0) {
    momDeltaPercentage = ((currentMonthTotal - prevMonthTotalRelative) / prevMonthTotalRelative) * 100;
  } else if (currentMonthTotal > 0) {
    momDeltaPercentage = 100;
  }

  res.status(200).json({
    success: true,
    timeframeDays: days,
    categoryTotals,
    topMerchants,
    monthlyComparison: {
      currentMonthTotal: Math.round(currentMonthTotal * 100) / 100,
      prevMonthTotalRelative: Math.round(prevMonthTotalRelative * 100) / 100,
      prevMonthTotalFull: Math.round(prevMonthTotalFull * 100) / 100,
      momDeltaPercentage: Math.round(momDeltaPercentage * 100) / 100
    }
  });
});

// Add to transactionController.js, export alongside existing functions
const getDashboardSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totals = await Transaction.aggregate([
    { $match: { user: req.user._id, date: { $gte: monthStart } } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);

  const income = totals.find((t) => t._id === 'income')?.total || 0;
  // Sum up everything that is NOT income as an expense
  const expense = totals.filter((t) => t._id !== 'income').reduce((acc, t) => acc + t.total, 0);

  res.status(200).json({
    success: true,
    income,
    expense,
    savings: income - expense,
  });
});

const getMonthlyTrend = asyncHandler(async (req, res) => {
  const monthsBack = Math.min(12, Math.max(1, parseInt(req.query.months, 10) || 6));
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);

  const trend = await Transaction.aggregate([
    { $match: { user: req.user._id, type: { $ne: 'income' }, date: { $gte: startDate } } },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        total: { $sum: '$amount' },
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Fill in months with zero spend so the chart doesn't skip gaps —
  // a missing month should show ₹0, not just disappear from the x-axis.
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const result = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const match = trend.find((t) => t._id.year === d.getFullYear() && t._id.month === d.getMonth() + 1);
    result.push({
      label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
      total: match ? Math.round(match.total * 100) / 100 : 0,
    });
  }

  res.status(200).json({ success: true, trend: result });
});

module.exports = { getTransactions, createTransaction, deleteTransaction, getTransactionStats, getDashboardSummary, getMonthlyTrend };
