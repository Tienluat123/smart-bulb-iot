// src/pages/Login/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
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

            const data = response.data;
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentDeviceId', data.deviceId || 'ESP32_001');
                // Chuyển hướng nhanh, không cần alert phiền phức
                navigate('/dashboard');
            }
        } catch (error) {
            console.error(error);
            alert("Thông tin đăng nhập chưa đúng nè!");
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
