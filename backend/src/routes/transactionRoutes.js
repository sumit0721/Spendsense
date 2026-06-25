const express = require('express');
const { getTransactions, createTransaction, deleteTransaction, getTransactionStats, getDashboardSummary, getMonthlyTrend } = require('../controllers/transactionController');
const { exportPDF, exportExcel } = require('../controllers/exportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All transaction routes require authentication

router.get('/stats', getTransactionStats);
router.get('/summary', getDashboardSummary);
router.get('/export/pdf', exportPDF);
router.get('/export/excel', exportExcel);
router.get('/trend', getMonthlyTrend);
router.route('/').get(getTransactions).post(createTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
