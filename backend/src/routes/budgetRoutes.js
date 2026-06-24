const express = require('express');
const { getBudgetForecast } = require('../controllers/aiAdvisorController');
const { getBudget, setBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getBudget);
router.post('/', setBudget);
router.get('/forecast', getBudgetForecast);

module.exports = router;
