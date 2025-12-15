// src/services/deviceService.js
import api from './api.service';


export const toggleDevicePower = async (state) => { // Bỏ tham số deviceId
    try {
        // Gọi API mới, chỉ cần gửi state
        const response = await api.post('/device/power', {
            state: state // 'ON' hoặc 'OFF'
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi bật tắt đèn:", error);
        throw error;
    }
};

// Không cần truyền deviceId vào hàm nữa
export const getDeviceStatus = async () => {
    try {
        // Gọi thẳng vào /status (Token trong header sẽ lo phần xác thực)
        const response = await api.get('/device/status'); 
        return response.data;
    } catch (error) {
        console.error("Lỗi status:", error);
        throw error;
    }
};

export const getSensorHistory = async () => {
    try {
        // Gọi thẳng vào /history
        const response = await api.get('/device/history'); 
        return response.data;
    } catch (error) {
        console.error("Lỗi history:", error);
        return [];
    }
};
