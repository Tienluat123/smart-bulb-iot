import { useState, useEffect, useCallback, useRef } from 'react';
import { getDeviceStatus, getSensorHistory, toggleDevicePower } from '../services/device.service';
import socketIOClient from "socket.io-client"; // 1. Import Socket

const SOCKET_URL = "http://localhost:5001"; // URL Backend

export const useSmartDevice = () => {
    const [deviceData, setDeviceData] = useState({
        temp: '--',
        hum: '--',
        amp: '--',
        lux: 0,
        raw_lux: 0,
        is_light_on: false
    });

    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });

    const [loading, setLoading] = useState(true);
    const socketRef = useRef();

    // --- LOGIC MAP LUX (Tách ra để tái sử dụng) ---
    const calculateLux = (rawLux) => {
        return Math.round((rawLux / 4095) * 1023);
    };

    // 1. Lấy dữ liệu LỊCH SỬ (Chỉ chạy 1 lần khi load trang để vẽ biểu đồ cũ)
    const fetchInitialData = useCallback(async () => {
        try {
            // A. Lấy trạng thái đèn
            const statusRes = await getDeviceStatus();
            
            // B. Lấy lịch sử cảm biến
            const historyRes = await getSensorHistory();
            const latestLog = historyRes.length > 0 ? historyRes[historyRes.length - 1] : {};
            
            // Cập nhật State ban đầu
            setDeviceData(prev => ({
                ...prev,
                is_light_on: statusRes.current_state?.power === 'ON',
                temp: latestLog.temp ?? '--',
                hum: latestLog.hum ?? '--',
                amp: latestLog.power ?? 0,
                lux: calculateLux(latestLog.lux ?? 0),
                raw_lux: latestLog.lux ?? 0
            }));

            // Vẽ biểu đồ ban đầu
            if (historyRes.length > 0) {
                setChartData({
                    labels: historyRes.map(item => {
                        if (item.time) {
                            return item.time;
                        }
                        if (item.timestamp) {
                            const d = new Date(item.timestamp);
                            if (!isNaN(d.getTime())) {
                                const hours = String(d.getHours()).padStart(2, '0');
                                const minutes = String(d.getMinutes()).padStart(2, '0');
                                const seconds = String(d.getSeconds()).padStart(2, '0');
                                return `${hours}:${minutes}:${seconds}`;
                            }
                        }
                        
                        return "--:--:--";
                    }),
                    datasets: [
                        {
                            label: 'Nhiệt độ (°C)',
                            data: historyRes.map(item => item.temp),
                            borderColor: '#f45d48',
                            backgroundColor: 'rgba(244, 93, 72, 0.1)',
                            tension: 0.4,
                            fill: true,
                        },
                        {
                            label: 'Độ ẩm (%)',
                            data: historyRes.map(item => item.hum),
                            borderColor: '#078080',
                            backgroundColor: 'rgba(7, 128, 128, 0.05)',
                            tension: 0.4,
                            fill: true,
                        }
                    ]
                });
            }
            setLoading(false);
        } catch (error) {
            console.error("Lỗi tải dữ liệu ban đầu:", error);
            setLoading(false);
        }
    }, []);

    // 2. Hàm Bật/Tắt đèn (Giữ nguyên)
    const toggleLight = async () => {
        const newState = !deviceData.is_light_on;
        const newStateString = newState ? 'ON' : 'OFF';
        setDeviceData(prev => ({ ...prev, is_light_on: newState }));
        try {
            await toggleDevicePower(newStateString);
        } catch (error) {
            setDeviceData(prev => ({ ...prev, is_light_on: !newState }));
            alert("Không thể thay đổi trạng thái đèn. Vui lòng thử lại.");
            console.error("Lỗi khi thay đổi trạng thái đèn:", error);
        }
    };

    // 3. SETUP SOCKET & INITIAL LOAD
    useEffect(() => {
        // A. Gọi API lấy dữ liệu cũ 1 lần duy nhất
        fetchInitialData();

        // B. Kết nối Socket
        socketRef.current = socketIOClient(SOCKET_URL);

        // Lấy Device ID để join room
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                const deviceId = parsedUser.deviceId;
                if (deviceId) {
                    socketRef.current.emit('join_device', deviceId);
                }
            } catch (e) {
                console.error("Lỗi phân tích userInfo từ localStorage:", e);
            }
        }

        // Lắng nghe khi kết nối thành công
        socketRef.current.on('connect', () => {});
        socketRef.current.on('disconnect', () => {});

        socketRef.current.on('sensor_update', (newData) => {
            const calculatedLux = calculateLux(newData.lux);
            setDeviceData(prev => ({
                ...prev,
                temp: newData.temp,
                hum: newData.hum,
                amp: newData.amp,
                lux: calculatedLux,
                raw_lux: newData.lux
            }));

            // 2. Cập nhật biểu đồ (Đẩy thêm 1 điểm vào cuối mảng)
            setChartData(prevChart => {
                const timeValue = newData.timestamp || newData.time || Date.now();
                const dateObj = new Date(timeValue);
                
                let newLabel;
                if (isNaN(dateObj.getTime())) {
                    newLabel = new Date().toLocaleTimeString('vi-VN');
                } else {
                    newLabel = dateObj.toLocaleTimeString('vi-VN');
                }
                
                const newLabels = [...prevChart.labels, newLabel].slice(-20); 
                const newTempData = [...prevChart.datasets[0].data, newData.temp].slice(-20);
                const newHumData = [...prevChart.datasets[1].data, newData.hum].slice(-20);

                return {
                    labels: newLabels,
                    datasets: [
                        { ...prevChart.datasets[0], data: newTempData },
                        { ...prevChart.datasets[1], data: newHumData }
                    ]
                };
            });
        });

        // D. Cleanup khi thoát trang
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [fetchInitialData]);

    return { deviceData, chartData, toggleLight, loading };
};
