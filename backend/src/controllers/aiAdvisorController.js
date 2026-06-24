const { asyncHandler, AppError } = require('../middleware/errorHandler');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { getGeminiClient } = require('../utils/geminiClient');
const { CATEGORIES } = require('../models/Transaction');

/**
 * @route   POST /api/advisor/ask
 * @desc    Ask the AI advisor a financial question
 * @access  Private
 */
const askAdvisor = asyncHandler(async (req, res) => {
  const question = req.body.question || req.body.prompt;

  if (!question) {
    throw new AppError('Question or prompt is required', 400);
  }

  const { model } = getGeminiClient();
  if (!model) {
    return res.status(503).json({
      success: false,
      message: 'AI Advisor is currently unavailable. Please verify that the GEMINI_API_KEY is configured.',
    });
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Retrieve user transaction aggregates, anomalies, and history in parallel for rich context
  const [categoryTotals, recentAnomalies, recentTransactions] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: ninetyDaysAgo }
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
    Transaction.find({
      user: req.user._id,
      isAnomaly: true,
      date: { $gte: ninetyDaysAgo }
    })
      .sort({ date: -1 })
      .limit(10)
      .select('merchant amount category date notes')
      .lean(),
    Transaction.find({
      user: req.user._id
    })
      .sort({ date: -1 })
      .limit(15)
      .select('merchant amount category date notes isAnomaly')
      .lean()
  ]);

  // Build the structured JSON context
  const contextData = {
    timeframe: 'Last 90 days',
    categoryTotals,
    flaggedAnomalies: recentAnomalies.map(t => ({
      merchant: t.merchant,
      amount: t.amount,
      category: t.category,
      date: t.date.toISOString().split('T')[0],
      notes: t.notes || ''
    })),
    recentTransactions: recentTransactions.map(t => ({
      merchant: t.merchant,
      amount: t.amount,
      category: t.category,
      date: t.date.toISOString().split('T')[0],
      notes: t.notes || '',
      isAnomaly: t.isAnomaly || false
    }))
  };

  // Structured prompt engineering with strict hallucination control rules
  const systemPrompt = `You are SpendSense Advisor, a personal finance assistant designed specifically for college students.
Your goal is to provide helpful, concise, and action-oriented financial advice to the student.

CRITICAL INSTRUCTIONS:
1. You MUST ONLY answer the user's question based on the transaction data provided in the CONTEXT below.
2. If the user asks a question about their transactions, spendings, or trends that cannot be answered or inferred directly from the provided CONTEXT, you must respond with: "I do not have access to that financial detail in your records."
3. Do NOT invent, assume, or hallucinate transactions, merchants, amounts, or categories that are not explicitly present in the CONTEXT.
4. Keep your responses brief, professional, and friendly. Where relevant, suggest student-friendly saving tips (e.g. cheap meals, campus discounts, cancellation of unused subscriptions).

CONTEXT:
${JSON.stringify(contextData, null, 2)}
`;

  try {
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${question}` }] }
      ]
    });
    
    const responseText = result.response.text().trim();
    
    res.status(200).json({
      success: true,
      answer: responseText,
    });
  } catch (error) {
    console.error('[Gemini API Error]:', error.message);
    throw new AppError('AI Advisor failed to generate a response. Please try again.', 500);
  }
});

/**
 * @route   GET /api/budgets/forecast
 * @desc    Get AI-translated budget forecast based on spending patterns
 * @access  Private
 */
const getBudgetForecast = asyncHandler(async (req, res) => {
  const { model } = getGeminiClient();
  
  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed
  const year = now.getFullYear();

  // 1. Fetch user's current month budget
  const budget = await Budget.findOne({ user: req.user._id, month, year });

  // 2. Fetch current month transactions
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const transactions = await Transaction.find({
    user: req.user._id,
    date: { $gte: currentMonthStart }
  }).lean();

  const currentDay = now.getDate();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Initialize stats per category
  const categoryForecasts = {};
  for (const cat of CATEGORIES) {
    categoryForecasts[cat] = {
      currentSpend: 0,
      limit: budget?.categoryLimits?.get(cat) || 0,
      projectedSpend: 0,
      velocity: 0,
      status: 'under'
    };
  }

  // Aggregate current month spend
  for (const t of transactions) {
    if (categoryForecasts[t.category]) {
      categoryForecasts[t.category].currentSpend += t.amount;
    }
  }

  // 3. Compute spend velocities and linear projections
  if (currentDay < 3) {
    // Cold start logic: handle instability on first 2 days of month by using previous month's averages
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const daysInPrevMonth = prevMonthEnd.getDate();

    const prevTransactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: prevMonthStart, $lte: prevMonthEnd }
    }).lean();

    const prevSpend = {};
    for (const t of prevTransactions) {
      prevSpend[t.category] = (prevSpend[t.category] || 0) + t.amount;
    }

    for (const cat of CATEGORIES) {
      const catPrevTotal = prevSpend[cat] || 0;
      const velocity = catPrevTotal / daysInPrevMonth;
      const stats = categoryForecasts[cat];
      
      stats.velocity = Math.round(velocity * 100) / 100;
      // Projected spend is current spend + (velocity * remaining days)
      const remainingDays = totalDaysInMonth - currentDay;
      stats.projectedSpend = Math.round((stats.currentSpend + (velocity * remainingDays)) * 100) / 100;
    }
  } else {
    // Calculate velocity based on current month's elapsed days
    for (const cat of CATEGORIES) {
      const stats = categoryForecasts[cat];
      const velocity = stats.currentSpend / currentDay;
      
      stats.velocity = Math.round(velocity * 100) / 100;
      stats.projectedSpend = Math.round((velocity * totalDaysInMonth) * 100) / 100;
    }
  }

  // Evaluate statuses
  const overBudgetWarnings = [];
  for (const cat of CATEGORIES) {
    const stats = categoryForecasts[cat];
    stats.currentSpend = Math.round(stats.currentSpend * 100) / 100;
    
    if (stats.limit > 0) {
      if (stats.projectedSpend > stats.limit) {
        stats.status = 'over';
        overBudgetWarnings.push(`${cat} (Spent: $${stats.currentSpend}, Projected: $${stats.projectedSpend}, Limit: $${stats.limit})`);
      } else if (stats.projectedSpend > stats.limit * 0.8) {
        stats.status = 'warning';
      }
    }
  }

  // 4. Generate AI advisory sentence based on projected data
  let advisorySentence = 'Your spending velocity is looking great! All categories are currently projected to stay within budget limits.';
  
  if (overBudgetWarnings.length > 0 && model) {
    const forecastPrompt = `You are a student finance advisor. We have programmatically projected the user's monthly spending based on daily velocity. 
The user is projected to exceed their budget limit in the following categories:
${overBudgetWarnings.join('\n')}

Translate this data into exactly one concise, friendly advisory sentence for the student. Do not do any math. Do not mention the exact numbers. Focus on suggesting an actionable adjustment.
Example: "You are projected to overshoot your Groceries and Dining budgets—try reducing takeout and packing lunches for the next few days to stay on track."
`;

    try {
      const result = await model.generateContent(forecastPrompt);
      advisorySentence = result.response.text().trim().replace(/^"|"$/g, '');
    } catch (err) {
      console.error('[Gemini Forecast Advisory Error]:', err.message);
      advisorySentence = `You are projected to exceed your budget limit in: ${overBudgetWarnings.map(w => w.split(' ')[0]).join(', ')}. Try trimming discretionary costs.`;
    }
  }

  // Format response details
  const forecastsList = Object.keys(categoryForecasts).map(cat => ({
    category: cat,
    ...categoryForecasts[cat]
  })).filter(f => f.limit > 0 || f.currentSpend > 0); // Only return categories with budgets or spendings

  res.status(200).json({
    success: true,
    month,
    year,
    daysElapsed: currentDay,
    totalDays: totalDaysInMonth,
    forecasts: forecastsList,
    advisorySentence
  });
});

module.exports = { askAdvisor, getBudgetForecast };
