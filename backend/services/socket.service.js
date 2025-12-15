const Device = require('../models/device.model');
const { sendCommand } = require('./mqtt.service'); // Import hàm gửi lệnh MQTT

const activeAlarms = new Map();
let ioInstance = null; // Biến để giữ instance của Socket.IO

const initSocket = (io) => {
    ioInstance = io; // Gán instance vào biến toàn cục

    // 1. Khi Server khởi động: Load toàn bộ báo thức đang bật từ DB vào RAM
    const syncAlarmsFromDB = async () => {
        try {
            const devices = await Device.find({ "alarm_config.is_active": true });
            devices.forEach(device => {
                if (device.alarm_config.time) {
                    activeAlarms.set(device.device_id, device.alarm_config.time);
                }
            });
            console.log(`🔄 Đã đồng bộ ${activeAlarms.size} báo thức vào RAM.`);
        } catch (err) {
            console.error("Lỗi sync alarm:", err);
        }
    };
    syncAlarmsFromDB();

    // 2. Vòng lặp kiểm tra báo thức (Quét qua danh sách Map)
    setInterval(async () => {
        if (activeAlarms.size === 0) return;

        const now = new Date();
        const currentString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        for (const [deviceId, alarmTime] of activeAlarms.entries()) {
            if (currentString === alarmTime) {
                console.log(`RENG RENG! Thiết bị ${deviceId} đến giờ: ${currentString}`);

                // A. Hú còi (Gửi MQTT xuống đúng thiết bị đó)
                sendCommand(deviceId, { action: "BUZZER", duration: 10000 });

                // B. Báo cho Web (Chỉ gửi vào phòng của thiết bị đó)
                io.to(deviceId).emit('alarm_triggered', { time: currentString });

                // C. Tắt báo thức trong RAM và DB (để không kêu lặp lại)
                activeAlarms.delete(deviceId);
                
                await Device.findOneAndUpdate(
                    { device_id: deviceId },
                    { "alarm_config.is_active": false }
                );

                // D. Cập nhật lại giao diện Web (Vì đã tắt)
                io.to(deviceId).emit('alarm_updated', { time: alarmTime, active: false });
            }
        }
    }, 10000); // Check mỗi 10s

    // 3. Xử lý kết nối Socket từ Frontend
    io.on('connection', (socket) => {
        
        socket.on('join_device', async (deviceId) => {
            socket.join(deviceId);
            const time = activeAlarms.get(deviceId) || null;
            const isActive = activeAlarms.has(deviceId);
            socket.emit('alarm_updated', { time, active: isActive });
        });

        // Đặt báo thức qua Socket (Ưu tiên dùng API REST, nhưng vẫn giữ lại)
        socket.on('set_alarm', async (data) => {
            const { deviceId, time, is_active } = data;
            if(!deviceId || !time) return;

            try {
                await Device.findOneAndUpdate(
                    { device_id: deviceId },
                    { "alarm_config.time": time, "alarm_config.is_active": is_active || true },
                    { upsert: true }
                );
                updateAlarmInRAM(deviceId, time, is_active || true); 
                console.log(`Đã đặt báo thức (qua Socket) cho ${deviceId} lúc ${time}`);
            } catch (e) { console.error(e); }
        });

        // ============================================
        // LOGIC POMODORO ĐÃ HOÀN THIỆN
        // ============================================
        socket.on('pomodoro_finished', async (data) => {
            // data = { deviceId: "ESP32_001", duration: 25 }
            const { deviceId, duration } = data;

            if(!deviceId) return;

            console.log(`Pomodoro xong trên thiết bị: ${deviceId}. Cộng ${duration || 25} phút vào KPI.`);
            
            // Hú còi báo hiệu kết thúc Pomodoro
            sendCommand(deviceId, { action: "BUZZER", duration: 3000 }); 

            // Cộng KPI vào DB bằng toán tử $inc
            await Device.findOneAndUpdate(
                { device_id: deviceId },
                { $inc: { 
                    "pomodoro_stats.total_sessions": 1, 
                    "pomodoro_stats.total_minutes": duration || 25 
                } },
                { new: true } // Lấy bản ghi mới để debug nếu cần
            );
        });
        // ============================================
        
        // Điều khiển đèn thủ công
        socket.on('control_light', (data) => {
            if(data.deviceId) {
                sendCommand(data.deviceId, data); 
            }
        });
    });
};

// [HÀM CẦU NỐI] Để Controller REST API gọi vào, đồng bộ RAM và báo cho Client
const updateAlarmInRAM = (deviceId, time, isActive) => {
    if (isActive && time) {
        activeAlarms.set(deviceId, time);
        console.log(`RAM Updated: Đặt báo thức ${deviceId} lúc ${time}`);
    } else {
        activeAlarms.delete(deviceId);
        console.log(`RAM Updated: Hủy báo thức ${deviceId}`);
    }

    // Báo cho tất cả Client đang xem thiết bị này biết
    if (ioInstance) {
        ioInstance.to(deviceId).emit('alarm_updated', { time, active: isActive });
    }
};

module.exports = { initSocket, updateAlarmInRAM };
