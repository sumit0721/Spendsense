const mongoose = require('mongoose');
const dotenv = require('dotenv');

const path = require('path');

// Load environment variables before anything else
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/spendsense';

const { startRecurringScheduler } = require('./utils/recurringScheduler');

/**
 * Connect to MongoDB and start the Express server.
 */
const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[MongoDB] Connected to database`);
    
    startRecurringScheduler();

    app.listen(PORT, () => {
      console.log(`[Server] SpendSense API running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown on unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('[Server] Unhandled Rejection:', err.message);
  process.exit(1);
});

startServer();
