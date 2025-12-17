const express = require('express');
const router = express.Router();
const reportPushsaferController = require('../controllers/reportPushsafer.controller');
const { protect } = require('../middlewares/auth.middleware');

// Định nghĩa route test gửi pushsafer -> POST /api/pushsafer/weekly
router.post('/weekly', protect, reportPushsaferController.getWeeklyReport);

module.exports = router;
