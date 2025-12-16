import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import './Profile.css';
import { getCurrentUser, updateProfile } from '../../services/auth.service';

const Profile = () => {
    // 1 State duy nhất chứa tất cả
    const [formData, setFormData] = useState({
        username: '',
        fullname: '',
        email: '',
        phone: '',
        currentPassword: '', // Mật khẩu hiện tại (Bắt buộc nếu đổi pass)
        newPassword: '',     // Mật khẩu mới
        confirmPassword: ''  // Xác nhận mật khẩu mới
    });

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Load dữ liệu khi vào trang
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await getCurrentUser();
                // Merge dữ liệu từ API vào form, giữ nguyên các trường password rỗng
                setFormData(prev => ({
                    ...prev,
                    username: response.data.username,
                    fullname: response.data.fullname,
                    email: response.data.email,
                    phone: response.data.phone || ''
                }));
            } catch (error) {
                console.error("Lỗi tải profile:", error);
            }
        };
        fetchUserInfo();
    }, []);

    // Xử lý nhập liệu chung cho tất cả các ô
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Xử lý Submit Form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        // --- VALIDATION TRƯỚC KHI GỬI ---
        
        // Nếu có nhập mật khẩu mới, thì phải kiểm tra xác nhận
        if (formData.newPassword) {
            if (formData.newPassword !== formData.confirmPassword) {
                setMessage("❌ Mật khẩu mới và xác nhận không khớp.");
                setLoading(false);
                return;
            }
            if (!formData.currentPassword) {
                setMessage("⚠️ Vui lòng nhập mật khẩu hiện tại để xác thực thay đổi.");
                setLoading(false);
                return;
            }
        }

        try {
            // Gọi API cập nhật gộp
            const response = await updateProfile({
                fullname: formData.fullname,
                email: formData.email,
                phone: formData.phone,
                currentPassword: formData.currentPassword, // Gửi kèm (Backend sẽ check nếu cần)
                newPassword: formData.newPassword          // Gửi kèm (Backend sẽ check nếu có)
            });

            setMessage(`✅ ${response.data.message}`);
            
            // Cập nhật lại localStorage tên hiển thị
            const storedUser = JSON.parse(localStorage.getItem('userInfo')) || {};
            localStorage.setItem('userInfo', JSON.stringify({
                ...storedUser,
                fullname: formData.fullname
            }));

            // Reset các ô mật khẩu sau khi thành công để an toàn
            setFormData(prev => ({ 
                ...prev, 
                currentPassword: '', 
                newPassword: '', 
                confirmPassword: '' 
            }));

        } catch (error) {
            const errorMsg = error.response?.data?.message || "Lỗi cập nhật.";
            setMessage(`❌ ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content">
                <div className="profile-container">
                    <div className="profile-header">
                        <h2>Hồ sơ của tôi 👤</h2>
                        <p>Quản lý thông tin và bảo mật tài khoản</p>
                    </div>

                    {message && (
                        <div className={`alert ${message.includes('✅') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}

                    <div className="card profile-single-card">
                        <form onSubmit={handleSubmit}>
                            
                            {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
                            <h3 className="section-title">Thông tin chung</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Tên đăng nhập</label>
                                    <input type="text" value={formData.username} disabled className="disabled-input" />
                                </div>
                                <div className="form-group">
                                    <label>Họ và Tên</label>
                                    <input type="text" name="fullname" value={formData.fullname} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Số điện thoại</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                                </div>
                            </div>

                            <hr className="divider" />

                            {/* PHẦN 2: BẢO MẬT (Chỉ điền khi muốn đổi pass) */}
                            <h3 className="section-title">Đổi mật khẩu <span className="optional">(Bỏ trống nếu không đổi)</span></h3>
                            
                            <div className="form-group">
                                <label>Mật khẩu mới</label>
                                <input 
                                    type="password" 
                                    name="newPassword" 
                                    value={formData.newPassword} 
                                    onChange={handleChange} 
                                    placeholder="Nhập mật khẩu mới..."
                                />
                            </div>

                            {/* Chỉ hiện 2 ô này nếu người dùng bắt đầu nhập mật khẩu mới */}
                            {formData.newPassword && (
                                <div className="password-confirm-section fade-in">
                                    <div className="form-group">
                                        <label>Nhập lại mật khẩu mới</label>
                                        <input 
                                            type="password" 
                                            name="confirmPassword" 
                                            value={formData.confirmPassword} 
                                            onChange={handleChange} 
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{color: '#d9534f'}}>Mật khẩu hiện tại (Để xác thực)</label>
                                        <input 
                                            type="password" 
                                            name="currentPassword" 
                                            value={formData.currentPassword} 
                                            onChange={handleChange} 
                                            required
                                            placeholder="Nhập mật khẩu cũ để lưu thay đổi..."
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-actions">
                                <button type="submit" className="save-btn" disabled={loading}>
                                    {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;
