const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportMail.controller');
const { protect } = require('../middleware/auth.middleware');

// Định nghĩa đường dẫn: GET /api/report/weekly -> gọi controller xử lý
router.post('/weekly', protect, reportController.getWeeklyReport);

module.exports = router;
