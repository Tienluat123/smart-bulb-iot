const { GoogleGenerativeAI } = require("@google/generative-ai");
const SensorLog = require('../models/sensorlog.model');
const User = require('../models/user.model');

// Khởi tạo Gemini AI (Dùng bản PRO để tránh lỗi 404)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chatWithAI = async (req, res) => {
    try {
        const { message } = req.body; // Câu hỏi người dùng
        const userId = req.user.id;

        // 1. Lấy thông tin User & Dữ liệu cảm biến mới nhất
        const user = await User.findById(userId);
        
        // Lấy log cảm biến mới nhất của user đó
        const latestLog = await SensorLog.findOne({ device_id: user.device_id })
                                         .sort({ timestamp: -1 });

        const rawSensorData = latestLog && latestLog.data ? latestLog.data : null; 
        
        // Trích xuất và làm sạch dữ liệu (THÊM AMPERE VÀO ĐÂY)
        const sensorData = {
            temperature: rawSensorData?.temperature || 25, 
            humidity: rawSensorData?.humidity || 50,
            light_level: rawSensorData?.light_level || 500,
            ampere: rawSensorData?.ampere || 0.00 // Thêm trường ampere (dùng 0.00 nếu không có)
        };

        // 2. Cấu hình System Prompt (Hướng dẫn AI)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

        const prompt = `
            Bạn là trợ lý ảo SmartHome thân thiện, ngắn gọn và chuyên nghiệp. 
            Nhiệm vụ của bạn là phải trả lời câu hỏi của người dùng dựa trên số liệu môi trường.

            QUY TẮC ĐÁNH GIÁ (Nên dùng để lập luận):
            - Lý tưởng học tập: Nhiệt độ 24-26°C | Độ ẩm 50-70% | Ánh sáng 300-600 Lux.
            - Phân tích Dòng điện (Ampere): Nếu Ampere > 0.5A, có thể thiết bị đang hoạt động công suất cao hoặc sắp quá tải.

            DỮ LIỆU CẢM BIẾN HIỆN TẠI:
            - Nhiệt độ (Temp): ${sensorData.temperature}°C
            - Độ ẩm (Hum): ${sensorData.humidity}%
            - Ánh sáng (Lux): ${sensorData.light_level} Lux
            - Dòng điện (Ampere): ${sensorData.ampere} A
            
            Người dùng hỏi: "${message}"
            
            Yêu cầu trả lời:
            1. Phải sử dụng DỮ LIỆU CẢM BIẾN để đánh giá chính xác.
            2. Nếu câu hỏi liên quan đến thiết bị/nguồn điện, hãy đề cập đến chỉ số Ampere.
            3. Trả lời bằng tiếng Việt, giọng điệu tự nhiên, chuyên nghiệp.
            4. Tuyệt đối KHÔNG dùng icon/emoji.
        `;

        // 3. Gọi AI
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // 4. Trả kết quả về Frontend
        res.json({
            reply: text,
            context_used: { data: sensorData, timestamp: latestLog?.timestamp } 
        });

    } catch (error) {
        console.error("Lỗi Chatbot:", error);
        res.status(500).json({ reply: "Xin lỗi, hệ thống đang bận, vui lòng thử lại sau.", error_detail: error.message });
    }
};
