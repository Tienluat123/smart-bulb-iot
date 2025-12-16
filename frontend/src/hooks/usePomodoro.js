import { useState, useRef, useEffect } from 'react';

export const usePomodoro = (initialMinutes = 0.3, socketInstance) => { 
    // State chỉ dùng để hiển thị, logic chính dựa vào LocalStorage
    const [pomoTime, setPomoTime] = useState(initialMinutes * 60);
    const [pomoActive, setPomoActive] = useState(false);
    const intervalRef = useRef(null);

    // Format hiển thị MM:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // --- HÀM CỐT LÕI: TÍNH TOÁN DỰA TRÊN MỐC THỜI GIAN ---
    const updateTimer = () => {
        // Lấy mốc thời gian kết thúc đã lưu
        const targetTime = localStorage.getItem('pomoTargetTime');
        
        if (targetTime) {
            const now = Date.now();
            const distance = Math.ceil((parseInt(targetTime) - now) / 1000); // Đổi ra giây
            
            if (distance > 0) {
                // Vẫn đang chạy
                setPomoTime(distance);
                setPomoActive(true);
            } else {
                // Đã hết giờ (hoặc vừa mới hết)
                handleFinish();
            }
        } else {
            // Không có mốc nào -> Đang dừng
            setPomoActive(false);
            if (!pomoActive) setPomoTime(initialMinutes * 60); // Chỉ reset visual nếu đang dừng hẳn
        }
    };

    // Xử lý khi hoàn thành
    const handleFinish = () => {
        // Chỉ chạy nếu đang có cờ active để tránh loop
        if (localStorage.getItem('pomoTargetTime')) {
            console.log("Pomodoro Finished!");
            
            // Xóa mốc thời gian để dừng
            localStorage.removeItem('pomoTargetTime');
            
            setPomoActive(false);
            setPomoTime(initialMinutes * 60);
            clearInterval(intervalRef.current); // Dừng vòng lặp

            alert("Hoàn thành phiên Pomodoro!");

            // --- SOCKET EMIT (Đã sửa lỗi deviceId) ---
            const storedUser = localStorage.getItem('userInfo');
            if (storedUser && socketInstance) {
                try {
                    const userObj = JSON.parse(storedUser);
                    // Lấy device_id hoặc deviceId tùy backend trả về cái nào
                    const id = userObj.device_id || userObj.deviceId; 
                    
                    if (id) {
                        socketInstance.emit('pomodoro_finished', { 
                            deviceId: id, 
                            duration: initialMinutes 
                        });
                        console.log(`[SOCKET] Đã báo KPI cho thiết bị: ${id}`);
                    }
                } catch (e) { console.error("Lỗi parse user:", e); }
            }
        }
    };

    // Bật / Tắt
    const togglePomodoro = () => {
        if (pomoActive) {
            // ĐANG CHẠY -> BẤM DỪNG (Hủy bỏ phiên)
            localStorage.removeItem('pomoTargetTime');
            setPomoActive(false);
            setPomoTime(initialMinutes * 60);
            clearInterval(intervalRef.current);
        } else {
            // ĐANG DỪNG -> BẤM CHẠY
            const now = Date.now();
            const target = now + initialMinutes * 60 * 1000; // Cộng thêm 25 phút (tính bằng ms)
            
            // Lưu mốc đích vào LocalStorage
            localStorage.setItem('pomoTargetTime', target);
            
            setPomoActive(true);
            
            // Chạy ngay lập tức để không bị delay 1s
            updateTimer();
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(updateTimer, 1000);
        }
    };

    // Reset bộ đếm
    const resetPomodoro = () => {
        localStorage.removeItem('pomoTargetTime');
        setPomoActive(false);
        setPomoTime(initialMinutes * 60);
        clearInterval(intervalRef.current);
    };

    // --- SETUP KHI LOAD TRANG (QUAN TRỌNG NHẤT) ---
    useEffect(() => {
        // Vừa vào trang, kiểm tra ngay xem có timer nào đang chạy dở không
        updateTimer();
        
        // Bắt đầu vòng lặp check
        intervalRef.current = setInterval(updateTimer, 1000);

        // Cleanup: Dọn dẹp interval khi component bị hủy (để tránh memory leak)
        return () => clearInterval(intervalRef.current);
    }, []); 

    return { 
        pomoTime, 
        pomoActive, 
        formatTime, 
        togglePomodoro, 
        resetPomodoro 
    };
};
