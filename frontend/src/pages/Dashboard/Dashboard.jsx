import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import { useSmartDevice } from '../../hooks/useSmartDevice'; // Import Hook vừa tạo
import './Dashboard.css';

import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
    // 1. Lấy dữ liệu từ Hook (Gọn gàng chưa!)
    const { deviceData, chartData, toggleLight, loading } = useSmartDevice();
    
    // 2. State hiển thị tên User (Chỉ để hiển thị UI)
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

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
            y: { grid: { borderDash: [5, 5], color: '#eee' }, min: 0 },
            x: { grid: { display: false } }
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content">
                <div className="header-section">
                    <h1>Xin chào, {userName}! 👋</h1>
                    <p>Hệ thống giám sát thông minh.</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <span className="stat-title">Nhiệt độ</span>
                        <div><span className="stat-value">{deviceData.temp}</span><span className="stat-unit">°C</span></div>
                    </div>
                    <div className="stat-card">
                        <span className="stat-title">Độ ẩm</span>
                        <div><span className="stat-value">{deviceData.hum}</span><span className="stat-unit">%</span></div>
                    </div>
                    <div className="stat-card">
                        <span className="stat-title">Dòng điện</span>
                        <div><span className="stat-value">{deviceData.amp}</span><span className="stat-unit">A</span></div>
                    </div>
                </div>

                <div className="charts-section">
                    <div className="chart-container">
                        <h3 style={{marginTop:0, color: '#232323'}}>Biểu đồ môi trường</h3>
                        <div style={{height: '320px'}}>
                             {!loading && chartData.labels.length > 0 ? (
                                <Line data={chartData} options={chartOptions} />
                             ) : (
                                <p style={{textAlign:'center', marginTop:'100px', color:'#999'}}>Đang tải dữ liệu...</p>
                             )}
                        </div>
                    </div>

                    {/* NÚT BẤM (Logic đã nằm trong toggleLight) */}
                    <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                         <h3 style={{marginTop:0, color: '#232323', alignSelf: 'flex-start'}}>Điều khiển đèn</h3>
                         
                         <button 
                            onClick={toggleLight}
                            style={{
                                width: '180px', height: '180px', borderRadius: '50%', border: 'none',
                                background: deviceData.is_light_on 
                                    ? 'linear-gradient(145deg, #078080, #056666)' 
                                    : 'linear-gradient(145deg, #ffffff, #e6e6e6)',
                                color: deviceData.is_light_on ? 'white' : '#232323',
                                fontSize: '24px', fontWeight: 'bold', cursor: 'pointer',
                                boxShadow: deviceData.is_light_on
                                    ? '0 10px 25px rgba(7, 128, 128, 0.4)' 
                                    : '10px 10px 20px #d1d1d1, -10px -10px 20px #ffffff',
                                transition: 'all 0.3s ease',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '20px'
                            }}
                         >
                            <span style={{ fontSize: '48px', marginBottom: '8px' }}>
                                {deviceData.is_light_on ? '💡' : '🌑'}
                            </span>
                            {deviceData.is_light_on ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                         </button>

                         <p style={{ marginTop: '20px', color: '#666' }}>
                             Chạm để {deviceData.is_light_on ? 'Tắt' : 'Bật'} đèn
                         </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
