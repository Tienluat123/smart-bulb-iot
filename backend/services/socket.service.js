const Device = require('../models/device.model');
const { sendCommand } = require('./mqtt.service'); 

const activeAlarms = new Map();
let ioInstance = null; 

const initSocket = (io) => {
    ioInstance = io; 

    // --- 1. ĐỒNG BỘ BÁO THỨC TỪ DB VÀO RAM ---
    const syncAlarmsFromDB = async () => {
        try {
            const devices = await Device.find({ "alarm_config.is_active": true });
            devices.forEach(device => {
                if (device.alarm_config.time) {
                    activeAlarms.set(device.device_id, device.alarm_config.time);
                }
            });
            console.log(`[SYSTEM] Đã đồng bộ ${activeAlarms.size} báo thức vào RAM.`);
        } catch (err) {
            console.error("Lỗi sync alarm:", err);
        }
    };
    syncAlarmsFromDB();

    // --- 2. VÒNG LẶP CHECK BÁO THỨC (TIMER) ---
    setInterval(async () => {
        if (activeAlarms.size === 0) return;

        const now = new Date();
        const currentString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        for (const [deviceId, alarmTime] of activeAlarms.entries()) {
            if (currentString === alarmTime) {
                console.log(`RENG RENG! Thiết bị ${deviceId} đến giờ: ${currentString}`);

                // A. Hú còi (MQTT)
                sendCommand(deviceId, { action: "BUZZER", duration: 10000 });

                // B. Báo cho Web (Realtime Event)
                // Chỉ gửi sự kiện "đã kích hoạt", không gửi toàn bộ config
                io.to(deviceId).emit('alarm_triggered', { time: currentString });

                // C. Tắt báo thức (RAM + DB)
                activeAlarms.delete(deviceId);
                await Device.findOneAndUpdate(
                    { device_id: deviceId },
                    { "alarm_config.is_active": false }
                );

                // D. Báo cho Web cập nhật lại nút gạt (Switch OFF)
                io.to(deviceId).emit('alarm_updated', { time: alarmTime, active: false });
            }
        }
    }, 10000); 

    // --- 3. XỬ LÝ KẾT NỐI SOCKET ---
    io.on('connection', (socket) => {
        
        // ➤ CHỈ JOIN PHÒNG (Pure Joining)
        // Không gửi lại data gì cả. Frontend tự fetch API lúc mới load.
        socket.on('join_device', (deviceId) => {
            if (deviceId) {
                socket.join(deviceId);
                console.log(`🔌 Socket ${socket.id} đã vào phòng: ${deviceId}`);
            }
        });

        // ➤ LOGIC POMODORO (Giữ nguyên)
        socket.on('pomodoro_finished', async (data) => {
            const { deviceId, duration } = data;
            if(!deviceId) return;

            // Kiểm tra bảo mật cơ bản: Socket này có đang ở trong phòng deviceId không?
            if (!socket.rooms.has(deviceId)) {
                console.warn(`⚠️ Socket lạ cố tình gửi Pomodoro cho ${deviceId}`);
                return;
            }

            console.log(`Pomodoro xong: ${deviceId} (+${duration || 25}p)`);
            
            // 1. Hú còi báo hiệu
            sendCommand(deviceId, { action: "BUZZER", duration: 3000 }); 

            // 2. Cộng KPI vào DB
            try {
                await Device.findOneAndUpdate(
                    { device_id: deviceId },
                    { $inc: { 
                        "pomodoro_stats.total_sessions": 1, 
                        "pomodoro_stats.total_minutes": duration || 25 
                    } }
                );
                // (Tùy chọn) Có thể emit ngược lại để báo "Cộng điểm thành công" nếu cần
                // io.to(deviceId).emit('pomodoro_update_success', { added: duration });
            } catch (error) {
                console.error("Lỗi lưu Pomodoro:", error);
            }
        });
    });
};

// [HÀM CẦU NỐI] Dùng cho Controller (API) gọi khi User đặt báo thức bằng HTTP Request
const updateAlarmInRAM = (deviceId, time, isActive) => {
    if (isActive && time) {
        activeAlarms.set(deviceId, time);
        console.log(`RAM Updated: Đặt báo thức ${deviceId} lúc ${time}`);
    } else {
        activeAlarms.delete(deviceId);
        console.log(`RAM Updated: Hủy báo thức ${deviceId}`);
    }

    // Bắn socket báo cho Frontend cập nhật UI Realtime (nếu đang mở app)
    if (ioInstance) {
        ioInstance.to(deviceId).emit('alarm_updated', { time, active: isActive });
    }
};

module.exports = { initSocket, updateAlarmInRAM };
