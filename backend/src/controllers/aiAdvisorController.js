const { asyncHandler, AppError } = require('../middleware/errorHandler');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const RecurringTransaction = require('../models/RecurringTransaction');
const { callGeminiWithFallback, getModel } = require('../utils/geminiClient');
const { EXPENSE_CATEGORIES } = require('../models/Transaction');

const askAdvisor = asyncHandler(async (req, res) => {
  const question = req.body.question || req.body.prompt;
  if (!question) {
    throw new AppError('Question or prompt is required', 400);
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      success: false,
      message: 'AI Advisor is currently unavailable. Please verify that the GEMINI_API_KEY is configured.',
    });
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [categoryTotals, recentAnomalies, recentTransactions, goals, recurring, dashboardSummary] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: ninetyDaysAgo } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $project: { category: '$_id', total: { $round: ['$total', 2] }, _id: 0 } },
      { $sort: { total: -1 } }
    ]),
    Transaction.find({ user: req.user._id, isAnomaly: true, date: { $gte: ninetyDaysAgo } })
      .sort({ date: -1 }).limit(10).select('merchant amount category date notes').lean(),
    Transaction.find({ user: req.user._id })
      .sort({ date: -1 }).limit(15).select('merchant amount category date notes isAnomaly type').lean(),
    SavingsGoal.find({ user: req.user._id, isCompleted: false }).lean(),
    RecurringTransaction.find({ user: req.user._id, isActive: true }).lean(),
    Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ])
  ]);

  const income = dashboardSummary.find(d => d._id === 'income')?.total || 0;
  const expense = dashboardSummary.find(d => d._id === 'expense')?.total || 0;

  const contextData = {
    timeframe: 'Last 90 days',
    currency: 'INR',
    categoryTotals,
    flaggedAnomalies: recentAnomalies.map(t => ({
      merchant: t.merchant, amount: t.amount, category: t.category,
      date: t.date.toISOString().split('T')[0], notes: t.notes || ''
    })),
    recentTransactions: recentTransactions.map(t => ({
      merchant: t.merchant, amount: t.amount, category: t.category,
      date: t.date.toISOString().split('T')[0], notes: t.notes || '', isAnomaly: t.isAnomaly || false, type: t.type || 'expense'
    })),
    monthlyIncome: income,
    monthlyExpense: expense,
    monthlySavings: income - expense,
    savingsGoals: goals.map(g => ({
      name: g.name, target: g.targetAmount, saved: g.savedAmount,
      remaining: g.targetAmount - g.savedAmount,
      percentComplete: Math.round((g.savedAmount / g.targetAmount) * 100),
    })),
    recurringMonthlyCommitments: recurring.map(r => ({ merchant: r.merchant, amount: r.amount, category: r.category })),
  };

  const systemPrompt = `You are SpendSense Advisor, a personal finance assistant designed specifically for college students in India.
Your goal is to provide helpful, concise, and action-oriented financial advice to the student.
All monetary amounts in the CONTEXT are in Indian Rupees (INR, ₹). Always use the ₹ symbol when referencing amounts — never use $.

CRITICAL INSTRUCTIONS:
1. You MUST ONLY answer the user's question based on the transaction data provided in the CONTEXT below.
2. If the user asks a question that cannot be answered or inferred directly from the provided CONTEXT, you must respond with: "I do not have access to that financial detail in your records."
3. Do NOT invent, assume, or hallucinate transactions, merchants, amounts, or categories not explicitly present in the CONTEXT.
4. Keep your responses brief, professional, and friendly. Where relevant, suggest student-friendly saving tips.
5. If the user has active savings goals in the CONTEXT, and they ask for saving advice, recommend a SPECIFIC category from their spending where reducing spend would meaningfully accelerate that goal — reference the actual category and amount from CONTEXT, not a generic tip.

CONTEXT:
${JSON.stringify(contextData, null, 2)}
`;

  try {
    let text;
    await callGeminiWithFallback(async (model) => {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${question}` }] }]
      });
      text = result.response.text();
    });
    res.status(200).json({ success: true, answer: text });
  } catch (error) {
    console.error('[Gemini API Error]:', error.message);
    throw new AppError('AI Advisor failed to generate a response. Please try again.', 500);
  }
});

const getBudgetForecast = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const budget = await Budget.findOne({ user: req.user._id, month, year });
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const transactions = await Transaction.find({ user: req.user._id, date: { $gte: currentMonthStart } }).lean();

  const currentDay = now.getDate();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const categoryForecasts = {};
  for (const cat of EXPENSE_CATEGORIES) {
    categoryForecasts[cat] = {
      currentSpend: 0, limit: budget?.categoryLimits?.get(cat) || 0,
      projectedSpend: 0, velocity: 0, status: 'under'
    };
  }

  for (const t of transactions) {
    if (categoryForecasts[t.category]) {
      categoryForecasts[t.category].currentSpend += t.amount;
    }
  }

  if (currentDay < 3) {
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const daysInPrevMonth = prevMonthEnd.getDate();
    const prevTransactions = await Transaction.find({
      user: req.user._id, date: { $gte: prevMonthStart, $lte: prevMonthEnd }
    }).lean();
    const prevSpend = {};
    for (const t of prevTransactions) {
      prevSpend[t.category] = (prevSpend[t.category] || 0) + t.amount;
    }
    for (const cat of EXPENSE_CATEGORIES) {
      const catPrevTotal = prevSpend[cat] || 0;
      const velocity = catPrevTotal / daysInPrevMonth;
      const stats = categoryForecasts[cat];
      stats.velocity = Math.round(velocity * 100) / 100;
      const remainingDays = totalDaysInMonth - currentDay;
      stats.projectedSpend = Math.round((stats.currentSpend + (velocity * remainingDays)) * 100) / 100;
    }
  } else {
    for (const cat of EXPENSE_CATEGORIES) {
      const stats = categoryForecasts[cat];
      const velocity = stats.currentSpend / currentDay;
      stats.velocity = Math.round(velocity * 100) / 100;
      stats.projectedSpend = Math.round((velocity * totalDaysInMonth) * 100) / 100;
    }
  }

  const overBudgetWarnings = [];
  for (const cat of EXPENSE_CATEGORIES) {
    const stats = categoryForecasts[cat];
    stats.currentSpend = Math.round(stats.currentSpend * 100) / 100;
    if (stats.limit > 0) {
      if (stats.projectedSpend > stats.limit) {
        stats.status = 'over';
        overBudgetWarnings.push(`${cat} (Spent: ₹${stats.currentSpend}, Projected: ₹${stats.projectedSpend}, Limit: ₹${stats.limit})`);
      } else if (stats.projectedSpend > stats.limit * 0.8) {
        stats.status = 'warning';
      }
    }
  }

  let advisorySentence = 'Your spending velocity is looking great! All categories are currently projected to stay within budget limits.';

  if (overBudgetWarnings.length > 0 && process.env.GEMINI_API_KEY) {
    const forecastPrompt = `You are a student finance advisor in India. All amounts are in Indian Rupees (₹) — always use ₹, never $.
We have programmatically projected the user's monthly spending based on daily velocity.
The user is projected to exceed their budget limit in the following categories:
${overBudgetWarnings.join('\n')}

Translate this data into exactly one concise, friendly advisory sentence for the student. Do not do any math. Do not mention the exact numbers. Focus on suggesting an actionable adjustment.`;

    try {
      let text;
      await callGeminiWithFallback(async (model) => {
        const result = await model.generateContent(forecastPrompt);
        text = result.response.text();
      });
      advisorySentence = text.replace(/^"|"$/g, '');
    } catch (err) {
      console.error('[Gemini Forecast Advisory Error]:', err.message);
      advisorySentence = `You are projected to exceed your budget limit in: ${overBudgetWarnings.map(w => w.split(' ')[0]).join(', ')}. Try trimming discretionary costs.`;
    }
  }

  const forecastsList = Object.keys(categoryForecasts).map(cat => ({
    category: cat, ...categoryForecasts[cat]
  })).filter(f => f.limit > 0 || f.currentSpend > 0);

  res.status(200).json({
    success: true, month, year, daysElapsed: currentDay,
    totalDays: totalDaysInMonth, forecasts: forecastsList, advisorySentence
  });
});

module.exports = { askAdvisor, getBudgetForecast };
