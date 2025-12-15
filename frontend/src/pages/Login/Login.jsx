// src/pages/Login/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.service';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
    try {
        const response = await api.post('/auth/login', {
            username,
            password
        });

        const data = response.data; // Dữ liệu backend trả về

        if (data.token) {
            // 1. Lưu Token (Quan trọng nhất để gọi API)
            localStorage.setItem('authToken', data.token);

            // 2. Lưu thông tin User (Gom lại thành chuỗi JSON)
            // Chúng ta lưu hết để sau này trang nào cần gì thì lôi ra dùng
            const userInfo = {
                id: data._id,
                username: data.username,
                fullname: data.fullname, // Ưu tiên hiển thị cái này
                email: data.email,
                deviceId: data.device_id
            };
            
            // LocalStorage chỉ lưu được chữ (string), nên phải dùng JSON.stringify
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            // 3. Chuyển hướng vào Dashboard
            navigate('/dashboard');
        }
    } catch (error) {
            console.error(error);
            alert("Đăng nhập thất bại. Kiểm tra lại thông tin nhé!");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                {/* Header đơn giản, Typography driven */}
                <h1 className="login-title">Đăng nhập</h1>
                <p className="login-subtitle">Chào mừng bạn quay trở lại Smart Home.</p>

                <div className="input-group">
                    <label className="input-label">Tài khoản</label>
                    <input 
                        className="happy-input"
                        type="text" 
                        placeholder="Nhập tên đăng nhập..."
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                
                <div className="input-group">
                    <label className="input-label">Mật khẩu</label>
                    <input 
                        className="happy-input"
                        type="password" 
                        placeholder="Nhập mật khẩu..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button className="happy-btn" onClick={handleLogin}>
                    Vào trang chủ
                </button>
            </div>
        </div>
    );
};

export default Login;
