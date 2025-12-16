const Device = require('../models/device.model');
const { sendCommand } = require('./mqtt.service'); 

const activeAlarms = new Map();
let ioInstance = null; 

const initSocket = (io) => {
    ioInstance = io; 

    const syncAlarmsFromDB = async () => {
        try {
            const devices = await Device.find({ "alarm_config.is_active": true });
            devices.forEach(device => {
                if (device.alarm_config.time) {
                    activeAlarms.set(device.device_id, device.alarm_config.time);
                }
            });
        } catch (err) {
            console.error("Lỗi sync alarm:", err);
        }
    };
    syncAlarmsFromDB();

    setInterval(async () => {
        if (activeAlarms.size === 0) return;

        const now = new Date();
        const currentString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        for (const [deviceId, alarmTime] of activeAlarms.entries()) {
            if (currentString === alarmTime) {
                console.log(`Alarm triggered: ${deviceId}`);

                sendCommand(deviceId, { action: "BUZZER", duration: 10000 });
                io.to(deviceId).emit('alarm_triggered', { time: currentString });
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

    io.on('connection', (socket) => {
        console.log(`[SOCKET] New connection: ${socket.id}`);
        
        socket.on('join_device', (deviceId) => {
            if (deviceId) {
                socket.join(deviceId);
                console.log(`[SOCKET] Device ${deviceId} joined`);
            }
        });

        socket.on('error', (error) => {
            console.error(`[SOCKET] Error:`, error);
        });

        // ➤ LOGIC POMODORO (Giữ nguyên)
        socket.on('pomodoro_finished', async (data) => {
            const { deviceId, duration } = data;
            if(!deviceId) return;

            if (!socket.rooms.has(deviceId)) {
                console.warn(`Unauthorized pomodoro: ${deviceId}`);
                return;
            }

            console.log(`Pomodoro done: ${deviceId}`);
            
            sendCommand(deviceId, { action: "BUZZER", duration: 3000 }); 

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
