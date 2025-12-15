const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middlewares/auth.middleware'); // Nhớ bảo vệ route

// POST /api/chat
router.post('/', protect, chatController.chatWithAI);

module.exports = router;
