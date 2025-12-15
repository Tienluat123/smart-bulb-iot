const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkAvailableModels() {
  try {
    // Đoạn code này sẽ list ra tất cả model mà Key của bạn nhìn thấy
    // Lưu ý: Dùng fetch thủ công vì SDK nodejs hàm listModels hơi khó gọi trực tiếp
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.models) {
        console.log("✅ DANH SÁCH MODEL BẠN ĐƯỢC DÙNG:");
        data.models.forEach(m => {
            if (m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${m.name.replace('models/', '')}`);
            }
        });
    } else {
        console.log("❌ Lỗi: ", data);
    }
  } catch (error) {
    console.error("Lỗi kết nối:", error);
  }
}

checkAvailableModels();
