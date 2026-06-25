const express = require('express');
const { protect } = require('../middleware/auth');
const { getRecurring, createRecurring, deleteRecurring, updateRecurring } = require('../controllers/recurringController');

const router = express.Router();
router.use(protect);

router.get('/', getRecurring);
router.post('/', createRecurring);
router.delete('/:id', deleteRecurring);
router.put('/:id', updateRecurring);

module.exports = router;
