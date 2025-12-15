import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import { useSocketAlarm } from '../../hooks/useSocketAlarm'; // Import Hook Báo thức
import { usePomodoro } from '../../hooks/usePomodoro';     // Import Hook Pomodoro
import './SmartFeatures.css'; // Nhớ tạo file CSS này nha

const SmartFeatures = () => {
    // Gọi các Hooks chức năng
    const { alarm, saveAlarm } = useSocketAlarm();
    const { pomoTime, pomoActive, formatTime, togglePomodoro, resetPomodoro } = usePomodoro(25);
    
    const [userName, setUserName] = useState('Admin');

    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            try {
                const userObj = JSON.parse(storedUser);
                setUserName(userObj.fullname || userObj.username || 'Admin');
            } catch (e) {}
        }
    }, []);

    return (
        <div className="dashboard-layout"> {/* Tái sử dụng layout của Dashboard */}
            <Sidebar />
            <main className="main-content">
                <div className="header-section">
                    <h1>Tiện ích thông minh 🛠️</h1>
                    <p>Quản lý thời gian và báo thức của bạn.</p>
                </div>

                {/* Grid 2 cột cho đẹp */}
                <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' }}>
                    
                    {/* --- WIDGET 1: BÁO THỨC --- */}
                    <div className="feature-card">
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#333' }}>⏰ Báo thức</h3>
                            {/* Toggle Switch */}
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={alarm.is_active}
                                    onChange={(e) => saveAlarm(alarm.time, e.target.checked)}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <input 
                                type="time" 
                                value={alarm.time || "07:00"}
                                onChange={(e) => saveAlarm(e.target.value, alarm.is_active)}
                                style={{
                                    fontSize: '56px',
                                    fontFamily: 'monospace',
                                    border: 'none',
                                    background: '#f0f2f5',
                                    padding: '10px 30px',
                                    borderRadius: '20px',
                                    color: alarm.is_active ? '#078080' : '#aaa',
                                    outline: 'none',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    boxShadow: 'inset 2px 2px 5px #ddd'
                                }}
                            />
                            <p style={{ marginTop: '20px', color: '#666', fontSize: '16px' }}>
                                {alarm.is_active ? `🔔 Đã bật lúc ${alarm.time}` : '🔕 Báo thức đang tắt'}
                            </p>
                        </div>
                    </div>

                    {/* --- WIDGET 2: POMODORO --- */}
                    <div className="feature-card">
                        <h3 style={{ margin: 0, marginBottom: '25px', color: '#333' }}>🍅 Pomodoro Focus</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {/* Vòng tròn đếm ngược */}
                            <div style={{
                                width: '160px', height: '160px',
                                borderRadius: '50%',
                                border: `8px solid ${pomoActive ? '#f45d48' : '#e0e0e0'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '42px', fontWeight: 'bold',
                                color: '#333',
                                marginBottom: '25px',
                                transition: 'border 0.3s ease',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
                            }}>
                                {formatTime(pomoTime)}
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button 
                                    onClick={togglePomodoro}
                                    style={{
                                        padding: '12px 28px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: pomoActive ? '#ffebee' : '#078080',
                                        color: pomoActive ? '#f45d48' : 'white',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {pomoActive ? '⏸ Tạm dừng' : '▶️ Bắt đầu'}
                                </button>
                                
                                <button 
                                    onClick={resetPomodoro}
                                    style={{
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: '1px solid #ddd',
                                        background: 'white',
                                        color: '#666',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '500'
                                    }}
                                >
                                    ↺ Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SmartFeatures;
