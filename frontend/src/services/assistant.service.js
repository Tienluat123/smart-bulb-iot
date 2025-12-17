import api from './api.service'; // Import instance Axios đã cấu hình

// Gửi câu hỏi đến Trợ lý AI
export const sendAIChat = async (question) => {
    // Giả định Backend API endpoint là /api/assistant/chat
    const response = await api.post('/chat', { message: question });
    return response;
};

// Gửi báo cáo 7 ngày qua email
export const sendWeeklyReport = async () => {
    // Giả định Backend API endpoint là /api/assistant/report
    const response = await api.post('/report/weekly');
    return response;
};

// Gửi thông báo thử nghiệm qua Pushsafer
export const sendTestPushNotification = async () => {
    const response = await api.post('/pushsafer/weekly');
    return response;
};