import { useState, useEffect } from 'react';
import socketIOClient from "socket.io-client";
import { getDeviceStatus, setDeviceAlarm } from '../services/device.service';

const SOCKET_URL = "http://localhost:5001"; // URL Backend của bạn

export const useSocketAlarm = () => {
    const [alarm, setAlarm] = useState({ time: '07:00', is_active: false });
    const [socketInstance, setSocketInstance] = useState(null);

    // 1. Lấy cấu hình báo thức ban đầu từ API (khi load trang)
    useEffect(() => {
        const fetchAlarmConfig = async () => {
            try {
                const statusRes = await getDeviceStatus();
                if (statusRes.alarm_config) {
                    setAlarm(statusRes.alarm_config);
                }
            } catch (error) {
                console.error("Lỗi lấy config báo thức", error);
            }
        };
        fetchAlarmConfig();
    }, []);

    // 2. Kết nối Socket & Lắng nghe sự kiện
    useEffect(() => {
        const socket = socketIOClient(SOCKET_URL);
        setSocketInstance(socket);

        // Lấy thông tin user để join đúng phòng
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            const { deviceId } = JSON.parse(storedUser);
            if (deviceId) {
                socket.emit('join_device', deviceId);
            }
        }

        // Nghe sự kiện: Báo thức được cập nhật (từ nơi khác)
        socket.on("alarm_updated", (data) => {
            setAlarm({ time: data.time, is_active: data.active });
        });

        // Nghe sự kiện: BÁO THỨC RENG RENG
        socket.on("alarm_triggered", (data) => {
            alert(`RENG RENG! Đã đến giờ: ${data.time}`);
            // Tự động tắt switch trên UI
            setAlarm(prev => ({ ...prev, is_active: false }));
        });

        // Cleanup khi thoát trang
        return () => {
            socket.disconnect();
        };
    }, []);

    // 3. Hàm lưu báo thức (Gọi API + Update UI)
    const saveAlarm = async (newTime, newActive) => {
        // Cập nhật UI ngay cho mượt
        setAlarm({ time: newTime, is_active: newActive });

        try {
            await setDeviceAlarm(newTime, newActive);
        } catch (error) {
            console.error("Lỗi lưu báo thức:", error);
            alert("Lỗi khi lưu báo thức!");
        }
    };

    return { alarm, saveAlarm, socketInstance };
};
