const Device = require('../models/device.model');
const { sendCommand } = require('./mqtt.service'); // Import hàm gửi lệnh

// [QUAN TRỌNG] Thay vì lưu 1 biến, ta dùng Map để lưu báo thức của TẤT CẢ thiết bị
// Key: device_id, Value: "HH:MM"
// Ví dụ: { "ESP32_001": "07:00", "ESP32_002": "08:30" }
const activeAlarms = new Map();

const initSocket = (io) => {

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
        if (activeAlarms.size === 0) return; // Không có báo thức thì nghỉ

        const now = new Date();
        const currentString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Duyệt qua từng thiết bị đang đặt báo thức
        for (const [deviceId, alarmTime] of activeAlarms.entries()) {
            if (currentString === alarmTime) {
                console.log(`⏰ RENG RENG! Thiết bị ${deviceId} đến giờ: ${currentString}`);

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

                // Cập nhật lại giao diện Web
                io.to(deviceId).emit('alarm_updated', { time: alarmTime, active: false });
            }
        }
    }, 10000); // Check mỗi 10s

    // 3. Xử lý kết nối Socket từ Frontend
    io.on('connection', (socket) => {
        // console.log('User connected:', socket.id);

        // [MỚI - QUAN TRỌNG] User phải báo danh xem mình đang dùng thiết bị nào
        socket.on('join_device', async (deviceId) => {
            socket.join(deviceId); // Đưa user vào "phòng riêng"
            // console.log(`User ${socket.id} đã vào phòng: ${deviceId}`);

            // Gửi ngay trạng thái báo thức hiện tại của thiết bị đó cho User
            const time = activeAlarms.get(deviceId) || null;
            const isActive = activeAlarms.has(deviceId);
            socket.emit('alarm_updated', { time, active: isActive });
        });

        // Đặt báo thức (Client phải gửi kèm deviceId)
        socket.on('set_alarm', async (data) => {
            // data = { deviceId: "ESP32_001", time: "07:00" }
            const { deviceId, time } = data;

            if(!deviceId || !time) return;

            try {
                // Lưu vào DB
                await Device.findOneAndUpdate(
                    { device_id: deviceId },
                    { "alarm_config.time": time, "alarm_config.is_active": true },
                    { upsert: true }
                );

                // Lưu vào RAM (Map)
                activeAlarms.set(deviceId, time);

                // Báo lại cho user (và các tab khác của user đó)
                io.to(deviceId).emit('alarm_updated', { time, active: true });
                console.log(`Đã đặt báo thức cho ${deviceId} lúc ${time}`);
            } catch (e) { console.error(e); }
        });

        // Pomodoro xong
        socket.on('pomodoro_finished', async (data) => {
            // data = { deviceId: "ESP32_001", duration: 25 }
            const { deviceId, duration } = data;

            if(!deviceId) return;

            console.log(`Pomodoro xong trên thiết bị: ${deviceId}`);
            
            // Hú còi
            sendCommand(deviceId, { action: "BUZZER", duration: 3000 });

            // Cộng KPI vào DB
            await Device.findOneAndUpdate(
                { device_id: deviceId },
                { $inc: { "pomodoro_stats.total_sessions": 1, "pomodoro_stats.total_minutes": duration || 25 } }
            );
        });
        
        // Điều khiển đèn thủ công
        socket.on('control_light', (data) => {
            // data = { deviceId: 'ESP32_001', mode: 'MANUAL', brightness: 100 }
            if(data.deviceId) {
                sendCommand(data.deviceId, data);
            }
        });
    });
};

module.exports = { initSocket };
