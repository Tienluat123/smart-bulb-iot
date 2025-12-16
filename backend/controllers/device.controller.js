const Device = require('../models/device.model');
const User = require('../models/user.model');
const SensorLog = require('../models/sensorlog.model');
const { sendCommand } = require('../services/mqtt.service');
const { updateAlarmInRAM } = require('../services/socket.service');


/**
 * @description Điều khiển Bật/Tắt thiết bị (Tự động lấy DeviceID từ Token)
 * @route POST /api/device/control/power
 * @body { "state": "ON" } hoặc { "state": "OFF" }
 */

exports.controlPower = async (req, res) => {
    try {
        // Validate đầu vào (Chỉ chấp nhận ON hoặc OFF)
        const { state } = req.body; 
        if (!['ON', 'OFF'].includes(state)) {
            return res.status(400).json({ message: "Trạng thái không hợp lệ. Chỉ gửi 'ON' hoặc 'OFF'." });
        }

        // Lấy Device ID từ User Token
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user || !user.device_id) {
            return res.status(404).json({ 
                message: "Tài khoản của bạn chưa liên kết với thiết bị nào." 
            });
        }
        
        const targetDeviceId = user.device_id;

        // 3. Cập nhật Database
        const updatedDevice = await Device.findOneAndUpdate(
            { device_id: targetDeviceId },
            { 'current_state.power': state },
            { new: true }
        );

        if (!updatedDevice) {
            return res.status(404).json({ message: "Không tìm thấy thiết bị trong hệ thống." });
        }

        // Gửi lệnh MQTT (Chỉ gửi Power)
        sendCommand(targetDeviceId, { power: state });

        // Trả về kết quả
        res.status(200).json({ 
            message: `Đã gửi lệnh ${state} thành công.`,
            state: updatedDevice.current_state
        });

    } catch (error) {
        console.error("Lỗi điều khiển nguồn:", error);
        res.status(500).json({ message: "Lỗi Server khi điều khiển thiết bị." });
    }
};

/**
 * @description Hàm kiểm tra trạng thái thiết bị
 * @route GET /api/device/status
 */

exports.getDeviceStatus = async (req, res) => {
    try {

        //Lấy Device ID từ User Token
        const userId = req.user.id;    
        const user = await User.findById(userId);
        if (!user || !user.device_id) {
            return res.status(404).json({ 
                message: "Tài khoản của bạn chưa liên kết với thiết bị nào." 
            });
        }

        const targetDeviceId = user.device_id;

        //Tìm thiết bị trong bảng Device
        const device = await Device.findOne({ device_id: targetDeviceId });
        if (!device) {
            return res.status(404).json({ 
                message: "Tài khoản của bạn chưa liên kết với thiết bị nào." 
            });
        }

        //Trả về trạng thái thiết bị
        res.json({
            device_id: device.device_id,
            name: device.name,
            is_online: device.is_online,
            current_state: device.current_state, // { power, brightness, mode, ... }
            alarm_config: device.alarm_config,
            pomodoro_stats: device.pomodoro_stats || { total_minutes: 0 }
        });

    } catch (error) {
        console.error("Lỗi lấy trạng thái:", error);
        res.status(500).json({ message: "Lỗi Server khi lấy trạng thái thiết bị." });
    }
};

/**
 * @description Lấy lịch sử cảm biến (SensorLog) của thiết bị người dùng
 * @route GET /api/device/history
 */

exports.getSensorHistory = async (req, res) => {
    try {
        // Lấy User ID từ Token
        const userId = req.user.id; 
        
        const user = await User.findById(userId);

        if (!user || !user.device_id) {
            return res.status(404).json({ 
                message: "Tài khoản của bạn chưa liên kết với thiết bị nào." 
            });
        }

        const targetDeviceId = user.device_id;

        // Tìm thiết bị
        const device = await Device.findOne({ device_id: targetDeviceId });
        if (!device) {
            return res.status(404).json({ message: "Thiết bị không tồn tại trong hệ thống!" });
        }

        // Lấy Log
        const limit = 10;
        const logs = await SensorLog.find({ device_id: targetDeviceId })
            .sort({ timestamp: -1}) // Sort theo timestamp hoặc _id đều được (giảm dần)
            .limit(limit);
        


        // Format dữ liệu
        const formattedData = logs.map(log => {
            // Lấy thời gian từ nhiều nguồn để đảm bảo không bị NaN
            const timeRaw = log.timestamp || log.createdAt || log._id.getTimestamp();
            const date = new Date(timeRaw);

            // Format HH:MM
            const timeString = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            
            return {
                time: timeString,
                temp: log.data?.temperature || 0,
                hum: log.data?.humidity || 0,
                power: log.data?.ampere || 0,
                lux: log.data?.light_level || 0
            };
        });

        res.json(formattedData);

    } catch (error) {
        console.error("Lỗi lấy lịch sử:", error);
        res.status(500).json({ message: "Lỗi Server" });
    }
};


/**
 * @description Cài đặt báo thức (Chỉ qua REST API - Bảo mật Token)
 * @route POST /api/device/alarm
 */
exports.setAlarm = async (req, res) => {
    try {
        const { time, is_active } = req.body;
        const userId = req.user.id; 
        
        // Lấy Device ID (Giữ nguyên)
        const user = await User.findById(userId);
        if (!user || !user.device_id) {
            return res.status(404).json({ message: "Chưa liên kết thiết bị." });
        }
        const targetDeviceId = user.device_id;

        // Cập nhật DB (Giữ nguyên)
        const updatedDevice = await Device.findOneAndUpdate(
            { device_id: targetDeviceId },
            { 
                'alarm_config.time': time,
                'alarm_config.is_active': is_active
            },
            { new: true }
        );
        
        if (!updatedDevice) {
             return res.status(404).json({ message: "Thiết bị không tồn tại trong DB." });
        }

        // Cập nhật ngay vào RAM của Socket Service
        // Việc này đảm bảo vòng lặp setInterval chạy trên Server sẽ bắt được giờ này.
        updateAlarmInRAM(targetDeviceId, time, is_active);


        // Ta chỉ gửi lệnh Bật Còi (BUZZER) khi Server bắt được giờ
        // sendCommand(targetDeviceId, { alarm_time: time, alarm_active: is_active }); <--- BỎ DÒNG NÀY

        //Trả về kết quả
        res.json({ message: "Đã lưu báo thức", alarm: updatedDevice.alarm_config });

    } catch (error) {
        console.error("Lỗi set alarm:", error);
        res.status(500).json({ message: "Lỗi Server" });
    }
};
