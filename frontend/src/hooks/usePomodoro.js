import { useState, useRef } from 'react';

export const usePomodoro = (initialMinutes = 25) => {
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
                        // Có thể gọi socket emit ở đây nếu muốn lưu KPI
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
