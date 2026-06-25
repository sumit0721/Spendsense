const express = require('express');
const { protect } = require('../middleware/auth');
const { getGoals, createGoal, updateGoalProgress, deleteGoal, updateGoal, deleteGoalContribution, editGoalContribution } = require('../controllers/savingsGoalController');

const router = express.Router();
router.use(protect);

router.get('/', getGoals);
router.post('/', createGoal);
router.patch('/:id/progress', updateGoalProgress);
router.delete('/:id', deleteGoal);
router.put('/:id', updateGoal);
router.delete('/:id/contributions/:contributionId', deleteGoalContribution);
router.put('/:id/contributions/:contributionId', editGoalContribution);

module.exports = router;
