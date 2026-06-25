const express = require('express');
const { protect } = require('../middleware/auth');
const { getGoals, createGoal, updateGoalProgress, deleteGoal } = require('../controllers/savingsGoalController');

const router = express.Router();
router.use(protect);

router.get('/', getGoals);
router.post('/', createGoal);
router.patch('/:id/progress', updateGoalProgress);
router.delete('/:id', deleteGoal);

module.exports = router;
