const express = require('express');
const { getTransactions, createTransaction, getTransactionStats } = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All transaction routes require authentication

router.get('/stats', getTransactionStats);
router.route('/').get(getTransactions).post(createTransaction);

module.exports = router;

