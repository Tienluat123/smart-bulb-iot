const Device = require('../models/device.model');
const SensorLog = require('../models/sensorlog.model');
const dotenv = require('dotenv');
const { sendPushNotification } = require('./pushsafer.service');

dotenv.config();

const deviceId = process.env.PUSHSAFER_DEVICE_ID;
const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

const checkRealtimeContinuousUsage = async () => {
    const devices = await Device.find();

    for (const device of devices) {
        // Chỉ kiểm tra nếu đèn đang bật
        if (device.current_state && device.current_state.power === 'ON') {
            // Tìm log gần nhất có trạng thái OFF trước thời điểm hiện tại
            const lastOffLog = await SensorLog.findOne({
                device_id: device.device_id,
                'current_state.power': 'OFF'
            }).sort({ timestamp: -1 });

            let onStart;
            if (lastOffLog) {
                // Lấy log đầu tiên có trạng thái ON sau log OFF này
                const firstOnLog = await SensorLog.findOne({
                    device_id: device.device_id,
                    'current_state.power': 'ON',
                    timestamp: { $gt: lastOffLog.timestamp }
                }).sort({ timestamp: 1 });

                onStart = firstOnLog ? firstOnLog.timestamp : lastOffLog.timestamp;
            } else {
                // Nếu chưa từng tắt, lấy log ON đầu tiên của thiết bị
                const firstOnLog = await SensorLog.findOne({
                    device_id: device.device_id,
                    'current_state.power': 'ON'
                }).sort({ timestamp: 1 });

                onStart = firstOnLog ? firstOnLog.timestamp : new Date();
            }

            const now = new Date();
            const duration = now - onStart;

            if (duration >= FIVE_HOURS_MS) {
                await sendPushNotification({
                    message: `Thiết bị ${device.device_id} đã bật đèn liên tục 5 tiếng. Hãy nghỉ ngơi để bảo vệ mắt!`,
                    title: 'Cảnh báo sử dụng!',
                    device: deviceId
                });
            }
        }
    }
};

module.exports = { checkRealtimeContinuousUsage };