import { useState, useEffect, useCallback } from 'react';
import { getDeviceStatus, getSensorHistory, toggleDevicePower } from '../services/device.service';

export const useSmartDevice = () => {
    const [deviceData, setDeviceData] = useState({
        temp: '--',
        hum: '--',
        amp: '--',
        lux: 0,      // <--- Thêm giá trị Lux (đã map về 0-1023)
        raw_lux: 0,  // (Tuỳ chọn) Lưu giá trị gốc 0-4095 nếu cần debug
        is_light_on: false
    });

    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });

    const [loading, setLoading] = useState(true);

    // 1. Hàm lấy trạng thái (Chỉ dùng khi load trang hoặc sau khi bấm nút)
    const fetchStatus = useCallback(async () => {
        try {
            const statusRes = await getDeviceStatus();
            setDeviceData(prev => ({
                ...prev,
                is_light_on: statusRes.current_state?.power === 'ON',
            }));
        } catch (error) {
            console.error("Lỗi fetch status", error);
        }
    }, []);

    // 2. Hàm lấy lịch sử & cảm biến (Chạy định kỳ 10s)
    const fetchHistory = useCallback(async () => {
        try {
            const historyRes = await getSensorHistory();
            const latestLog = historyRes.length > 0 ? historyRes[historyRes.length - 1] : {};

            // --- LOGIC MAP LUX (0-4095 -> 0-1023) ---
            const rawLux = latestLog.lux ?? 0;
            // Công thức: (Giá trị / Max cũ) * Max mới
            const mappedLux = Math.round((rawLux / 4095) * 1023);

            setDeviceData(prev => ({
                ...prev,
                temp: latestLog.temp ?? '--',
                hum: latestLog.hum ?? '--',
                amp: latestLog.power ?? 0,
                lux: mappedLux,       // Giá trị đã scale (0 - 1023)
                raw_lux: rawLux       // Giá trị gốc
            }));

            if (historyRes.length > 0) {
                setChartData({
                    labels: historyRes.map(item => item.time),
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
            console.error("Lỗi fetch history", error);
        }
    }, []);

    // 3. Hàm Bật/Tắt đèn
    const toggleLight = async () => {
        const newState = !deviceData.is_light_on;
        const newStateString = newState ? 'ON' : 'OFF';

        // Cập nhật giao diện NGAY LẬP TỨC (Optimistic UI)
        setDeviceData(prev => ({ ...prev, is_light_on: newState }));

        try {
            await toggleDevicePower(newStateString);
            // Không cần gọi lại fetchStatus nữa nếu bạn tin tưởng API thành công
            // Web tự nhớ trạng thái vừa bấm
        } catch (error) {
            // Nếu lỗi thì quay xe về cũ
            setDeviceData(prev => ({ ...prev, is_light_on: !newState }));
            alert("Lỗi kết nối! Không thể điều khiển đèn.");
        }
    };

    // 4. SETUP LOGIC CHẠY (Effect)
    useEffect(() => {
        // A. Chạy ngay khi vào trang (Mount)
        fetchStatus();  // Lấy trạng thái đèn 1 lần
        fetchHistory(); // Lấy dữ liệu cảm biến 1 lần

        // B. Thiết lập vòng lặp CHO CẢM BIẾN THÔI (10s)
        const historyInterval = setInterval(fetchHistory, 2000);

        // C. Dọn dẹp
        return () => {
            clearInterval(historyInterval);
        };
        // Lưu ý: Không còn statusInterval nữa!
    }, [fetchStatus, fetchHistory]);

    return { deviceData, chartData, toggleLight, loading };
};
