
const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/power', protect, deviceController.controlPower);
router.get('/history', protect, deviceController.getSensorHistory); 
router.get('/status', protect, deviceController.getDeviceStatus);


module.exports = router;
