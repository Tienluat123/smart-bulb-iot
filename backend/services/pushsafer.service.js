const Pushsafer = require('pushsafer-notifications');
const dotenv = require('dotenv');
const Device = require('../models/device.model');
const SensorLog = require('../models/sensorlog.model');

dotenv.config();

const push = new Pushsafer({
    k: process.env.PUSHSAFER_PRIVATE_KEY,
    debug: false
});

/**
 * Gửi thông báo Pushsafer.
 * @param {Object} options - Các tuỳ chọn thông báo.
 * @param {string} options.message - Nội dung thông báo.
 * @param {string} options.title - Tiêu đề thông báo.
 * @param {string} [options.device] - ID thiết bị nhận thông báo.
 * @returns {Promise<Object>} Kết quả gửi thông báo.
 */
const sendPushNotification = ({ message, title, device }) => {
    const payload = {
        m: message,
        t: title,
        d: device || process.env.PUSHSAFER_DEVICE_ID
    };

    return new Promise((resolve, reject) => {
        push.send(payload, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
};

/**
 * Kiểm tra và gửi cảnh báo nếu thiết bị bật đèn liên tục 5 tiếng.
 */
const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

const checkRealtimeContinuousUsage = async () => {
    const devices = await Device.find();

    for (const device of devices) {
        if (device.current_state && device.current_state.power === 'ON') {
            // Tìm log OFF gần nhất
            const lastOffLog = await SensorLog.findOne({
                device_id: device.device_id,
                'data.power': 'OFF'
            }).sort({ timestamp: -1 });

            let onStart;
            if (lastOffLog) {
                // Lấy log ON đầu tiên sau log OFF này
                const firstOnLog = await SensorLog.findOne({
                    device_id: device.device_id,
                    'data.power': 'ON',
                    timestamp: { $gt: lastOffLog.timestamp }
                }).sort({ timestamp: 1 });

                onStart = firstOnLog ? firstOnLog.timestamp : lastOffLog.timestamp;
            } else {
                // Nếu chưa từng tắt, lấy log ON đầu tiên
                const firstOnLog = await SensorLog.findOne({
                    device_id: device.device_id,
                    'data.power': 'ON'
                }).sort({ timestamp: 1 });

                onStart = firstOnLog ? firstOnLog.timestamp : new Date();
            }

            const now = new Date();
            const duration = now - onStart;

            if (duration >= FIVE_HOURS_MS) {
                await sendPushNotification({
                    message: `Thiết bị ${device.device_id} đã bật đèn liên tục 5 tiếng. Hãy nghỉ ngơi để bảo vệ mắt!`,
                    title: 'Cảnh báo sử dụng!',
                    device: device.device_id // hoặc deviceId nếu bạn muốn gửi đến thiết bị mặc định
                });
            }
        }
    }
};

module.exports = {
    sendPushNotification,
    checkRealtimeContinuousUsage
};