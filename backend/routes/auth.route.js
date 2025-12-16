const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

// Chỉ còn 2 đường dẫn
router.post('/login', authController.loginUser);       // Ai cũng gọi được
router.put('/profile', protect, authController.updateProfile); // Phải có Token mới gọi được
router.get('/me', protect, authController.getCurrentUser);
module.exports = router;
