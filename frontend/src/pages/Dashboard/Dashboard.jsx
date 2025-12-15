// src/pages/Dashboard/Dashboard.jsx
import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
// Import thêm hàm getSensorHistory
import { getDeviceStatus, getSensorHistory } from '../../services/device.service'; 
import './Dashboard.css';

import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
    const [userName, setUserName] = useState('Người dùng');
    
    // State cho các thẻ (Cards)
    const [deviceData, setDeviceData] = useState({
        temp: '--',
        hum: '--',
        power_usage: '--',
        is_light_on: false
    });

    // State cho biểu đồ (Mặc định rỗng)
    const [chartData, setChartData] = useState({
        labels: [], // Trục hoành (Thời gian)
        datasets: [] // Dữ liệu đường vẽ
    });

    // Hàm cập nhật dữ liệu (Chạy mỗi 10s)
    const fetchData = async () => {
        const deviceId = localStorage.getItem('currentDeviceId');
        if (!deviceId) return;

        try {
            // 1. Gọi song song 2 API: Trạng thái hiện tại & Lịch sử biểu đồ
            const [statusRes, historyRes] = await Promise.all([
                getDeviceStatus(),   
                getSensorHistory()  
            ]);

            // --- XỬ LÝ THẺ (CARDS) ---
            // Nếu API history có dữ liệu, lấy phần tử cuối cùng làm giá trị hiện tại (chính xác nhất)
            const latestLog = historyRes.length > 0 ? historyRes[historyRes.length - 1] : {};

            setDeviceData({
                is_light_on: statusRes.current_state?.power === 'ON',
                // Ưu tiên lấy từ Log mới nhất, nếu không có thì lấy từ status (nếu backend có trả về)
                temp: latestLog.temp ?? '--',
                hum: latestLog.hum ?? '--',
                power_usage: latestLog.amp ?? '--' // Ví dụ lấy KPI làm điện năng giả định
            });

            // --- XỬ LÝ BIỂU ĐỒ (REAL CHART) ---
            if (historyRes.length > 0) {
                setChartData({
                    labels: historyRes.map(item => item.time), // Mảng giờ: ['14:00', '14:05'...]
                    datasets: [
                        {
                            label: 'Nhiệt độ (°C)',
                            data: historyRes.map(item => item.temp), // Mảng nhiệt độ thật
                            borderColor: '#f45d48',
                            backgroundColor: 'rgba(244, 93, 72, 0.1)',
                            tension: 0.4,
                            fill: true,
                        },
                        {
                            label: 'Độ ẩm (%)',
                            data: historyRes.map(item => item.hum), // Mảng độ ẩm thật
                            borderColor: '#078080',
                            backgroundColor: 'rgba(7, 128, 128, 0.05)',
                            tension: 0.4,
                            fill: true,
                        }
                    ],
                });
            }

        } catch (error) {
            console.error("Lỗi cập nhật Dashboard:", error);
        }
    };

    useEffect(() => {
        const savedName = localStorage.getItem('userName');
        if (savedName) setUserName(savedName);

        fetchData(); // Gọi ngay lần đầu

        const intervalId = setInterval(() => {
            fetchData(); // Gọi lại mỗi 10s
        }, 10000);

        return () => clearInterval(intervalId);
    }, []);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
            y: { grid: { borderDash: [5, 5], color: '#eee' }, min: 0 }, // min 0 để biểu đồ đẹp hơn
            x: { grid: { display: false } }
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content">
                <div className="header-section">
                    <h1>Xin chào, {userName}! 👋</h1>
                    <p>Dữ liệu được cập nhật trực tiếp từ thiết bị mỗi 10 giây.</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <span className="stat-title">Nhiệt độ</span>
                        <div>
                            <span className="stat-value">{deviceData.temp}</span>
                            <span className="stat-unit">°C</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <span className="stat-title">Độ ẩm</span>
                        <div>
                            <span className="stat-value">{deviceData.hum}</span>
                            <span className="stat-unit">%</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <span className="stat-title">Tổng thời gian</span>
                        <div>
                            <span className="stat-value">{deviceData.power_usage}</span>
                            <span className="stat-unit">phút</span>
                        </div>
                    </div>
                </div>

                <div className="charts-section">
                    <div className="chart-container">
                        <h3 style={{marginTop:0, color: '#232323'}}>Biểu đồ môi trường (Real-time)</h3>
                        <div style={{height: '320px'}}>
                            {/* Chỉ vẽ khi có dữ liệu */}
                            {chartData.labels.length > 0 ? (
                                <Line data={chartData} options={chartOptions} />
                            ) : (
                                <p style={{textAlign:'center', marginTop:'100px', color:'#999'}}>Đang tải dữ liệu từ cảm biến...</p>
                            )}
                        </div>
                    </div>

                    <div className="chart-container">
                         <h3 style={{marginTop:0, color: '#232323'}}>Thiết bị đang bật</h3>
                         <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px', fontSize: '18px' }}>
                            <span style={{ marginRight: '10px' }}>💡 Đèn phòng ngủ:</span>
                            <b style={{ 
                                color: deviceData.is_light_on ? '#078080' : '#f45d48',
                                background: deviceData.is_light_on ? '#e0f2f1' : '#ffebee',
                                padding: '4px 12px', borderRadius: '20px', fontSize: '16px'
                            }}>
                                {deviceData.is_light_on ? 'ON' : 'OFF'}
                            </b>
                         </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
