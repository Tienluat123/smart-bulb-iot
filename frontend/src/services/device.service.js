// src/services/deviceService.js
import api from './api.service';

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
