const express = require('express');
const { askAdvisor, getChatHistory, syncChatHistory, clearChatHistory } = require('../controllers/aiAdvisorController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/ask', askAdvisor);
router.get('/chat', getChatHistory);
router.put('/chat', syncChatHistory);
router.delete('/chat', clearChatHistory);

module.exports = router;
