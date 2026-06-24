const express = require('express');
const { askAdvisor } = require('../controllers/aiAdvisorController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/ask', askAdvisor);

module.exports = router;
