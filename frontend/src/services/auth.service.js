import api from './api.service';

// Lấy thông tin hiện tại
export const getCurrentUser = async () => {
    return api.get('/auth/me'); 
};

// Hàm GỘP: Cập nhật Profile (Thông tin + Mật khẩu)
export const updateProfile = async (data) => {
    // data sẽ bao gồm: { fullname, email, phone, currentPassword, newPassword }
    return api.put('/auth/profile', data); 
};
