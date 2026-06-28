const express = require('express');
const { protect } = require('../middleware/auth');
const { upload, scanReceipt } = require('../controllers/receiptController');

const router = express.Router();

router.post('/scan', protect, upload, scanReceipt);

module.exports = router;
