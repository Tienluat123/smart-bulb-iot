import { useState, useRef } from 'react';

export const usePomodoro = (initialMinutes = 25, socketInstance) => { 
// ^^^ CHÚ Ý: Đã thêm tham số socketInstance
    const [pomoTime, setPomoTime] = useState(initialMinutes * 60);
    const [pomoActive, setPomoActive] = useState(false);
    const intervalRef = useRef(null);


    // Format giây sang MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Bật / Tắt bộ đếm
    const togglePomodoro = () => {
        if (pomoActive) {
            // Đang chạy -> Pause
            clearInterval(intervalRef.current);
            setPomoActive(false);
        } else {
            // Đang dừng -> Start
            setPomoActive(true);
            intervalRef.current = setInterval(() => {
                setPomoTime((prev) => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current);
                        setPomoActive(false);
                        alert("🎉 Hoàn thành phiên Pomodoro!");
                        
                        // ===============================================
                        // 🔥🔥🔥 EMIT SOCKET Ở ĐÂY 🔥🔥🔥
                        // ===============================================
                        const storedUser = localStorage.getItem('userInfo');
                        let deviceId = null;
                        if (storedUser) {
                            deviceId = JSON.parse(storedUser).deviceId;
                        }

                        console.log(`[SOCKET EMIT] Chuẩn bị báo kết thúc Pomodoro cho thiết bị: ${deviceId}`);

                        if (socketInstance && deviceId) {
                             socketInstance.emit('pomodoro_finished', { 
                                 deviceId: deviceId, 
                                 duration: initialMinutes // Gửi 25 phút
                             });
                             console.log(`[SOCKET EMIT] Đã báo kết thúc Pomodoro cho thiết bị: ${deviceId}`);
                        } else {
                             console.error("Lỗi: Không tìm thấy Socket hoặc DeviceID để emit Pomodoro.");
                        }
                        // ===============================================
                        
                        return initialMinutes * 60; // Reset
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    };

    // Reset bộ đếm
    const resetPomodoro = () => {
        clearInterval(intervalRef.current);
        setPomoActive(false);
        setPomoTime(initialMinutes * 60);
    };

    return { 
        pomoTime, 
        pomoActive, 
        formatTime, 
        togglePomodoro, 
        resetPomodoro 
    };
};
