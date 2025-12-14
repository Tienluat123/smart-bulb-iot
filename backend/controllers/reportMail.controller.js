const SensorLog = require('../models/sensorlog.model');
const User = require('../models/user.model');
const { runPythonAI } = require('../services/ai.service');
const { sendReportEmail } = require('../services/email.service');

exports.getWeeklyReport = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Lấy thông tin User & Device
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User không tồn tại" });

        // 2. Lấy dữ liệu cảm biến tuần qua
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const stats = await SensorLog.aggregate([
            { $match: { device_id: user.device_id, timestamp: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: null,
                    avg_temp: { $avg: "$data.temperature" },
                    avg_hum:  { $avg: "$data.humidity" },
                    avg_lux:  { $avg: "$data.light_level" }
                }
            }
        ]);

        // Nếu không có dữ liệu thì fake tạm để test
        const data = stats.length > 0 ? stats[0] : { avg_temp: 28, avg_hum: 65, avg_lux: 400 };

        // 3. Gọi AI Service (Chờ AI tính toán xong)
        console.log("Đang gọi AI phân tích...");
        const aiResult = await runPythonAI(data.avg_temp, data.avg_hum, data.avg_lux);

        // 4. Gọi Email Service (Gửi mail đi)
        console.log("Đang gửi email...");
        await sendReportEmail(user.email, user.fullname, data, aiResult);

        // 5. Trả kết quả về cho Frontend
        res.json({
            message: "Đã gửi báo cáo thành công!",
            email_sent_to: user.email,
            ai_result: aiResult
        });

    } catch (err) {
        console.error("Lỗi:", err);
        res.status(500).json({ error: "Có lỗi xảy ra: " + err.message });
    }
};
