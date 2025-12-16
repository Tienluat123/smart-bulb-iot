import { useEffect, useState, useRef } from 'react';
import socketIOClient from "socket.io-client";

const SOCKET_URL = "http://localhost:5001";

export const useSocketConnection = () => {
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        // 1. Tạo kết nối
        socketRef.current = socketIOClient(SOCKET_URL);

        // 2. Lấy Device ID và Join phòng ngay lập tức
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            try {
                const { device_id, deviceId } = JSON.parse(storedUser);
                const id = device_id || deviceId;
                if (id) {
                    socketRef.current.emit('join_device', id);
                    console.log(`🔌 [Socket] Đã join phòng: ${id}`);
                }
            } catch(e) { console.error(e); }
        }

        setSocket(socketRef.current);

        // 3. Cleanup khi thoát App
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    return socket;
};
