const cron = require('node-cron');
const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');

/**
 * Runs once daily at midnight. Checks every active recurring transaction
 * for the current user — if today's date matches its dayOfMonth AND it
 * hasn't already run this month/year, creates a real Transaction and
 * marks it as run. This is the actual auto-add mechanism: it runs
 * inside the Node process, not as a separate service, which is fine for
 * a single-instance deployment (Render) but WOULD double-fire if you
 * ever ran multiple server instances — flagging that limitation now
 * rather than hiding it.
 */
const startRecurringScheduler = () => {
  cron.schedule('0 0 * * *', async () => {
    const now = new Date();
    const today = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const due = await RecurringTransaction.find({
      isActive: true,
      dayOfMonth: today,
      $or: [
        { lastRunMonth: { $ne: month } },
        { lastRunYear: { $ne: year } },
      ],
    });

    for (const rec of due) {
      try {
        await Transaction.create({
          user: rec.user,
          merchant: rec.merchant,
          amount: rec.amount,
          type: 'expense',
          category: rec.category,
          paymentMethod: rec.paymentMethod,
          date: now,
          source: 'recurring',
          notes: 'Auto-added recurring transaction',
        });
        rec.lastRunMonth = month;
        rec.lastRunYear = year;
        await rec.save();
        console.log(`[Recurring] Created transaction for ${rec.merchant} (user ${rec.user})`);
      } catch (err) {
        console.error(`[Recurring] Failed to create transaction for ${rec.merchant}:`, err.message);
      }
    }
  });
  console.log('[Recurring] Scheduler started — checking daily at midnight.');
};

module.exports = { startRecurringScheduler };
