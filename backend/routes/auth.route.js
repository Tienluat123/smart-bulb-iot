const express = require('express');
const router = express.Router();
const { loginUser, updateProfile } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Chỉ còn 2 đường dẫn
router.post('/login', loginUser);       // Ai cũng gọi được
router.put('/profile', protect, updateProfile); // Phải có Token mới gọi được
module.exports = router;
