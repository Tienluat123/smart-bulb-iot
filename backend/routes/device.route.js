
const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/manual-power', protect, deviceController.manualPowerControl);
router.post('/enable-auto', protect, deviceController.enableAutoControl);


module.exports = router;
