const { GoogleGenerativeAI } = require("@google/generative-ai");
const SensorLog = require('../models/sensorlog.model'); 
const Device = require('../models/device.model'); // <--- IMPORT THÊM CÁI NÀY
const User = require('../models/user.model');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chatWithAI = async (req, res) => {
    try {
        const { message } = req.body; 
        const userId = req.user.id;

        // 1. Lấy thông tin User
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ reply: "Không tìm thấy thông tin người dùng." });

        // 2. Lấy cấu hình & Trạng thái thiết bị (Bảng Device)
        const device = await Device.findOne({ device_id: user.device_id });
        
        // 3. Lấy môi trường hiện tại (Bảng SensorLog)
        const latestLog = await SensorLog.findOne({ device_id: user.device_id })
                                         .sort({ timestamp: -1 });

        // --- CHUẨN BỊ DỮ LIỆU ĐỂ GỬI CHO AI ---
        
        // A. Dữ liệu Môi trường (Sensor)
        const rawData = latestLog?.data || {};
        const sensorInfo = {
            temp: rawData.temperature ?? "Không rõ",
            hum: rawData.humidity ?? "Không rõ",
            lux: rawData.light_level ?? 0,
            amp: rawData.ampere ?? 0.00
        };

        // B. Dữ liệu Thiết bị (Device Config)
        const deviceInfo = device ? {
            name: user.device_id,
            power: device.current_state.power, // ON/OFF
            mode: device.current_state.mode,   // MANUAL, SLEEP...
            is_online: device.is_online ? "Đang kết nối" : "Mất kết nối",
            
            // Báo thức
            alarm: device.alarm_config.is_active 
                   ? `Đang bật lúc ${device.alarm_config.time}` 
                   : "Đang tắt",
            
            // KPI Pomodoro
            kpi_sessions: device.pomodoro_stats.total_sessions,
            kpi_minutes: device.pomodoro_stats.total_minutes,

            // Lịch trình
            schedule: `Sáng bật lúc ${device.schedule_config.morning_start}, Tối bật lúc ${device.schedule_config.night_start}`
        } : { status: "Chưa kích hoạt thiết bị" };

        // 4. Cấu hình Model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        [VAI TRÒ]
        Bạn là quản gia thông minh (SmartHome AI) của chủ nhân tên là "${user.fullname}".
        Bạn nắm rõ mọi ngóc ngách và thông số của thiết bị trong nhà.

        [HỒ SƠ HỆ THỐNG - DỮ LIỆU THỰC TẾ]
        --------------------------------------------------
        1. TRẠNG THÁI THIẾT BỊ (Quan trọng):
           - Đèn đang: ${deviceInfo.power} (Chế độ: ${deviceInfo.mode})
           - Mạng: ${deviceInfo.is_online}
           - Báo thức: ${deviceInfo.alarm}
           
        2. MÔI TRƯỜNG SỐNG (Cảm biến):
           - Nhiệt độ: ${sensorInfo.temp}°C
           - Độ ẩm: ${sensorInfo.hum}%
           - Ánh sáng: ${sensorInfo.lux} Lux
           - Dòng điện tiêu thụ: ${sensorInfo.amp} A (Nếu > 0.5A là cao)

        3. THÀNH TÍCH HỌC TẬP (Pomodoro):
           - Tổng số phiên đã học: ${deviceInfo.kpi_sessions} lần
           - Tổng thời gian tập trung: ${deviceInfo.kpi_minutes} phút
           (Hãy khen ngợi nếu thời gian > 60 phút, nhắc nhở nếu < 30 phút)
        --------------------------------------------------

        [YÊU CẦU TRẢ LỜI]
        Người dùng hỏi: "${message}"

        Quy tắc:
        1. Dựa vào dữ liệu trên để trả lời chính xác.
        2. Nếu người dùng hỏi về KPI/Học tập -> Dùng mục số 3.
        3. Nếu người dùng hỏi về Báo thức -> Dùng mục số 1.
        4. Nếu người dùng hỏi "Nhà ổn không" -> Kết hợp mục 1 và 2.
        5. Giọng điệu: Thân thiện, tôn trọng chủ nhân "${user.fullname}".
        
        [TRẢ LỜI NGAY]:
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error("Lỗi Chatbot:", error);
        res.status(500).json({ reply: "Xin lỗi, tôi đang bị chóng mặt chút xíu (Lỗi Server)." });
    }
};
