const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  const Transaction = mongoose.connection.collection('transactions');
  const result = await Transaction.updateMany(
    { type: { $exists: false } },
    { $set: { type: 'expense', paymentMethod: 'Other', source: 'manual' } }
  );
  console.log(`Migrated ${result.modifiedCount} transactions.`);
  await mongoose.disconnect();
}

migrate().catch(console.error);
