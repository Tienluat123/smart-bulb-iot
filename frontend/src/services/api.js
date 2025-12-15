import axios from 'axios';

// Tạo một instance của axios với cấu hình mặc định
const api = axios.create({
    baseURL: 'http://localhost:3000/api', // Đổi port nếu server bạn khác
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================================
// INTERCEPTOR (Người gác cổng)
// Tự động gắn Token vào mọi request gửi đi nếu có trong LocalStorage
// ============================================================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
