const express = require('express');
const { getBudgetForecast } = require('../controllers/aiAdvisorController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/forecast', getBudgetForecast);

module.exports = router;
