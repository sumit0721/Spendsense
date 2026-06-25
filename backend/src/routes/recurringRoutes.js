const express = require('express');
const { protect } = require('../middleware/auth');
const { getRecurring, createRecurring, deleteRecurring } = require('../controllers/recurringController');

const router = express.Router();
router.use(protect);

router.get('/', getRecurring);
router.post('/', createRecurring);
router.delete('/:id', deleteRecurring);

module.exports = router;
