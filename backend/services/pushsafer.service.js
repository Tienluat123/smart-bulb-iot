dotenv.config();

const Pushsafer = require('pushsafer-notifications');
const dotenv = require('dotenv');
dotenv.config();

const push = new Pushsafer({
    k: process.env.PUSHSAFER_PRIVATE_KEY,
    debug: false
});

/**
 * Gửi thông báo Pushsafer cơ bản.
 * @param {Object} options - Các tuỳ chọn thông báo.
 * @param {string} options.message - Nội dung thông báo.
 * @param {string} options.title - Tiêu đề thông báo.
 * @param {string} [options.device] - ID thiết bị nhận thông báo.
 * @returns {Promise<Object>} Kết quả gửi thông báo.
 */
const sendPushNotification = ({ message, title }) => {
    const payload = {
        m: message,
        t: title,
        d: process.env.PUSHSAFER_DEVICE_ID
    };
    return new Promise((resolve, reject) => {
        push.send(payload, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

/**
 * Gửi báo cáo môi trường học tập qua Pushsafer.
 * @param {string} userDeviceId - ID thiết bị nhận thông báo.
 * @param {string} userName - Tên người dùng.
 * @param {Object} stats - Thông số môi trường (avg_temp, avg_hum, avg_lux).
 * @param {Object} aiResult - Kết quả AI (score, env_evaluation, advise).
 */
const sendReportPushsafer = async (userDeviceId, userName, stats, aiResult) => {
    // 1. Xử lý Điểm số
    const score = aiResult.score || 0;
    // 2. Đánh giá chung
    const conditionLabel = aiResult.env_evaluation || "Chưa xác định";
    // 3. Lời khuyên
    const rawAdvice = aiResult.advise || "Không có lời khuyên cụ thể.";

    // 4. Format nội dung thông báo
    const message =
        `👋 Xin chào ${userName}!\n` +
        `Báo cáo môi trường học tập tuần qua:\n` +
        `🌡 Nhiệt độ TB: ${Number(stats.avg_temp).toFixed(1)}°C\n` +
        `💧 Độ ẩm TB: ${Number(stats.avg_hum).toFixed(1)}%\n` +
        `💡 Ánh sáng TB: ${Number(stats.avg_lux).toFixed(0)} Lux\n` +
        `🤖 AI đánh giá: ${conditionLabel}\n` +
        `⭐ Điểm số: ${score}/100\n` +
        `💡 Lời khuyên: ${rawAdvice}`;

    const title = `Báo Cáo Tuần - SmartBulb IoT`;

    await sendPushNotification({
        message,
        title,
        device: userDeviceId
    });
};

// ... Giữ lại hàm cảnh báo liên tục nếu cần ...

module.exports = {
    sendPushNotification,
    sendReportPushsafer
};