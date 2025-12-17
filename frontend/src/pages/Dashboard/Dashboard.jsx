import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import { useSmartDevice } from '../../hooks/useSmartDevice'; 
import './Dashboard.css';

import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
    const { deviceData, chartData, toggleLight, loading } = useSmartDevice();
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
                        <span className="stat-title">Công suất</span>
                        <div><span className="stat-value">{deviceData.amp}</span><span className="stat-unit">W</span></div>
                    </div>
                </div>

                <div className="charts-section">
                    {/* BIỂU ĐỒ */}
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

                    {/* KHU VỰC ĐIỀU KHIỂN & ĐỘ SÁNG */}
                    <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                         <h3 style={{marginTop:0, color: '#232323', alignSelf: 'flex-start'}}>Điều khiển</h3>
                         
                         {/* 1. NÚT BẤM (Giữ nguyên) */}
                         <button 
                            onClick={toggleLight}
                            style={{
                                width: '160px', height: '160px', borderRadius: '50%', border: 'none',
                                background: deviceData.is_light_on 
                                    ? 'linear-gradient(145deg, #078080, #056666)' 
                                    : 'linear-gradient(145deg, #ffffff, #e6e6e6)',
                                color: deviceData.is_light_on ? 'white' : '#232323',
                                fontSize: '20px', fontWeight: 'bold', cursor: 'pointer',
                                boxShadow: deviceData.is_light_on
                                    ? '0 10px 25px rgba(7, 128, 128, 0.4)' 
                                    : '10px 10px 20px #d1d1d1, -10px -10px 20px #ffffff',
                                transition: 'all 0.3s ease',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                marginTop: '10px', marginBottom: '30px'
                            }}
                         >
                            <span style={{ fontSize: '42px', marginBottom: '8px' }}>
                                {deviceData.is_light_on ? '💡' : '🌑'}
                            </span>
                            {deviceData.is_light_on ? 'ON' : 'OFF'}
                         </button>

                         {/* 2. THANH HIỂN THỊ ĐỘ SÁNG (LUX) - PHẦN MỚI THÊM VÀO */}
                         <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {/* <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666', fontWeight: '500' }}>
                                <span>Ánh sáng</span>
                                <span>{deviceData.lux} / 1023</span>
                            </div> */}
                            
                            {/* Khung thanh bar */}
                            {/* <div style={{
                                width: '100%',
                                height: '12px',
                                background: '#eee',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                boxShadow: 'inset 2px 2px 5px #e0e0e0' // Đổ bóng trong nhẹ tạo chiều sâu
                            }}>
                                {/* Thanh hiển thị giá trị */}
                                {/* <div style={{
                                    width: `${(deviceData.lux / 1023) * 100}%`, // Tính % độ dài
                                    height: '100%',
                                    // Gradient vàng cam (nhìn như ánh nắng)
                                    background: 'linear-gradient(90deg, #f6d365 0%, #fda085 100%)',
                                    borderRadius: '10px',
                                    transition: 'width 0.5s ease-out', // Hiệu ứng trượt mượt mà
                                    boxShadow: '0 0 10px rgba(253, 160, 133, 0.5)' // Phát sáng nhẹ
                                }}></div> */}
                            {/* </div> */} 
                            

                         </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
