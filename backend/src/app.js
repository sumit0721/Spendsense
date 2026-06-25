const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const advisorRoutes = require('./routes/advisorRoutes');
const savingsGoalRoutes = require('./routes/savingsGoalRoutes');
const recurringRoutes = require('./routes/recurringRoutes');

const app = express();

// --------------- Security Middleware ---------------
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// --------------- Rate Limiting ---------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// --------------- Body Parsing ---------------
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --------------- Health Check ---------------
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SpendSense API is running',
    timestamp: new Date().toISOString(),
  });
});

// --------------- API Routes ---------------
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/goals', savingsGoalRoutes);
app.use('/api/recurring', recurringRoutes);

// --------------- 404 Handler ---------------
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// --------------- Centralized Error Handler ---------------
app.use(errorHandler);

module.exports = app;
