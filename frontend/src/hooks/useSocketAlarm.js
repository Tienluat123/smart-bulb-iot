import { useState, useEffect } from 'react';
import { setDeviceAlarm, getDeviceStatus } from '../services/device.service'; 
// Nhớ import API setDeviceAlarm (đã sửa ở bước trước dùng API chứ ko dùng socket)

export const useSocketAlarm = (socketInstance) => { // <--- NHẬN SOCKET TỪ NGOÀI
    const [alarm, setAlarm] = useState({ time: '07:00', is_active: false });

    // 1. Lấy dữ liệu ban đầu từ API
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await getDeviceStatus();
                if (res.alarm_config) setAlarm(res.alarm_config);
            } catch (e) { console.error(e); }
        };
        fetchConfig();
    }, []);

    // 2. Lắng nghe Socket để cập nhật Realtime
    useEffect(() => {
        if (!socketInstance) return;

        // Khi báo thức reng
        socketInstance.on('alarm_triggered', (data) => {
            alert(`RENG RENG! Bây giờ là: ${data.time}`);
        });

        // Khi có ai đó thay đổi báo thức (đồng bộ trạng thái)
        socketInstance.on('alarm_updated', (data) => {
            console.log("Sync Alarm:", data);
            setAlarm({ time: data.time, is_active: data.active });
        });

        return () => {
            socketInstance.off('alarm_triggered');
            socketInstance.off('alarm_updated');
        };
    }, [socketInstance]);

    // 3. Hàm lưu báo thức (Gọi API)
    const saveAlarm = async (time, isActive) => {
        // Cập nhật giao diện ngay cho mượt
        setAlarm({ time, is_active: isActive }); 
        try {
            await setDeviceAlarm(time, isActive);
        } catch (error) {
            console.error("Lỗi lưu báo thức:", error);
            // Nếu lỗi thì revert lại state (tuỳ chọn)
        }
    };

    return { alarm, saveAlarm };
};
