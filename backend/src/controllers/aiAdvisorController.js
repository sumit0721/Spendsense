const { asyncHandler, AppError } = require('../middleware/errorHandler');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const RecurringTransaction = require('../models/RecurringTransaction');
const Chat = require('../models/Chat');
const { callGeminiWithFallback } = require('../utils/geminiClient');
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

  const month = parseInt(req.body.month, 10) || null;
  const year = parseInt(req.body.year, 10) || null;

  let contextStart, contextEnd, contextLabel;
  if (month && year) {
    contextStart = new Date(year, month - 1, 1);
    contextEnd = new Date(year, month, 0, 23, 59, 59, 999);
    contextLabel = `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month - 1]} ${year}`;
  } else {
    contextStart = new Date();
    contextStart.setDate(contextStart.getDate() - 90);
    contextEnd = new Date();
    contextLabel = 'Last 90 days';
  }

  const [categoryTotals, recentAnomalies, recentTransactions, goals, recurring, dashboardSummary] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: contextStart, $lte: contextEnd } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $project: { category: '$_id', total: { $round: ['$total', 2] }, _id: 0 } },
      { $sort: { total: -1 } }
    ]),
    Transaction.find({ user: req.user._id, isAnomaly: true, date: { $gte: contextStart, $lte: contextEnd } })
      .sort({ date: -1 }).limit(10).select('merchant amount category date notes').lean(),
    Transaction.find({ user: req.user._id, date: { $gte: contextStart, $lte: contextEnd } })
      .sort({ date: -1 }).limit(15).select('merchant amount category date notes isAnomaly type').lean(),
    SavingsGoal.find({ user: req.user._id, isCompleted: false }).lean(),
    RecurringTransaction.find({ user: req.user._id, isActive: true }).lean(),
    Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: contextStart, $lte: contextEnd } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ])
  ]);

  const income = dashboardSummary.find(d => d._id === 'income')?.total || 0;
  const expense = dashboardSummary.find(d => d._id === 'expense')?.total || 0;

  const contextData = {
    timeframe: contextLabel,
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
      fundingHistory: (g.contributions || []).map(c => ({ amount: c.amount, date: c.date.toISOString().split('T')[0], notes: c.notes || '' }))
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
  const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);
  const year = parseInt(req.query.year, 10) || now.getFullYear();

  const isCurrentMonth = month === (now.getMonth() + 1) && year === now.getFullYear();
  const isFutureMonth = new Date(year, month - 1, 1) > new Date(now.getFullYear(), now.getMonth(), 1);

  const budget = await Budget.findOne({ user: req.user._id, month, year });
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const transactions = await Transaction.find({ user: req.user._id, date: { $gte: monthStart, $lte: monthEnd } }).lean();

  const currentDay = isCurrentMonth ? now.getDate() : new Date(year, month, 0).getDate(); // full month if past
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  const categoryForecasts = {};
  for (const cat of EXPENSE_CATEGORIES) {
    categoryForecasts[cat] = { currentSpend: 0, limit: budget?.categoryLimits?.get(cat) || 0, projectedSpend: 0, velocity: 0, status: 'under' };
  }

  for (const t of transactions) {
    if (categoryForecasts[t.category]) categoryForecasts[t.category].currentSpend += t.amount;
  }

  if (isFutureMonth) {
    // A future month has zero actuals and no velocity to project from —
    // nothing meaningful to forecast yet.
    for (const cat of EXPENSE_CATEGORIES) categoryForecasts[cat].status = 'no-data';
  } else if (isCurrentMonth) {
    // Existing forecast logic — UNCHANGED — only runs for the real current month.
    if (currentDay < 3) {
      const prevMonthStart = new Date(year, month - 2, 1);
      const prevMonthEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);
      const daysInPrevMonth = prevMonthEnd.getDate();
      const prevTransactions = await Transaction.find({ user: req.user._id, date: { $gte: prevMonthStart, $lte: prevMonthEnd } }).lean();
      const prevSpend = {};
      for (const t of prevTransactions) prevSpend[t.category] = (prevSpend[t.category] || 0) + t.amount;
      for (const cat of EXPENSE_CATEGORIES) {
        const velocity = (prevSpend[cat] || 0) / daysInPrevMonth;
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
  } else {
    // PAST month: no projection needed — actuals ARE the final number.
    // projectedSpend = currentSpend, since the month is already over.
    for (const cat of EXPENSE_CATEGORIES) {
      categoryForecasts[cat].projectedSpend = categoryForecasts[cat].currentSpend;
    }
  }

  const overBudgetWarnings = [];
  for (const cat of EXPENSE_CATEGORIES) {
    const stats = categoryForecasts[cat];
    stats.currentSpend = Math.round(stats.currentSpend * 100) / 100;
    if (stats.limit > 0 && stats.status !== 'no-data') {
      if (stats.projectedSpend > stats.limit) {
        stats.status = isCurrentMonth ? 'over' : 'exceeded';
        overBudgetWarnings.push(`${cat} (Spent: ₹${stats.currentSpend}, Limit: ₹${stats.limit})`);
      } else if (isCurrentMonth && stats.projectedSpend > stats.limit * 0.8) {
        stats.status = 'warning';
      }
    }
  }

  let advisorySentence;
  if (isFutureMonth) {
    advisorySentence = 'This month is in the future — no spending data yet.';
  } else if (isCurrentMonth) {
    advisorySentence = overBudgetWarnings.length > 0
      ? `You are projected to exceed your budget limit in: ${overBudgetWarnings.map(w => w.split(' ')[0]).join(', ')}. Try trimming discretionary costs.`
      : 'Your spending velocity is looking great! All categories are currently projected to stay within budget limits.';
  } else {
    advisorySentence = overBudgetWarnings.length > 0
      ? `This month, you exceeded your budget in: ${overBudgetWarnings.map(w => w.split(' ')[0]).join(', ')}.`
      : 'This month is complete — you stayed within budget in every category.';
  }

  const forecastsList = Object.keys(categoryForecasts).map(cat => ({ category: cat, ...categoryForecasts[cat] }))
    .filter(f => f.limit > 0 || f.currentSpend > 0);

  res.status(200).json({
    success: true, month, year, daysElapsed: currentDay, totalDays: totalDaysInMonth,
    forecasts: forecastsList, advisorySentence,
    isPastMonth: !isCurrentMonth && !isFutureMonth,
    isFutureMonth,
  });
});

const getChatHistory = asyncHandler(async (req, res) => {
  let chat = await Chat.findOne({ user: req.user._id });
  if (!chat) {
    chat = await Chat.create({ user: req.user._id, messages: [] });
  }
  res.status(200).json({ success: true, messages: chat.messages });
});

const syncChatHistory = asyncHandler(async (req, res) => {
  const { messages } = req.body;
  let chat = await Chat.findOne({ user: req.user._id });
  if (!chat) {
    chat = new Chat({ user: req.user._id, messages: [] });
  }
  chat.messages = messages;
  await chat.save();
  res.status(200).json({ success: true, messages: chat.messages });
});

const clearChatHistory = asyncHandler(async (req, res) => {
  await Chat.findOneAndUpdate({ user: req.user._id }, { messages: [] });
  res.status(200).json({ success: true, messages: [] });
});

module.exports = { askAdvisor, getBudgetForecast, getChatHistory, syncChatHistory, clearChatHistory };
