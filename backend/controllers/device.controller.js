const Device = require('../models/device.model');
const User = require('../models/user.model');
const SensorLog = require('../models/sensorlog.model');
const { sendCommand } = require('../services/mqtt.service'); // Import hàm gửi lệnh MQTT

/**
 * @description Điều khiển Bật/Tắt thiết bị (Tự động lấy DeviceID từ Token)
 * @route POST /api/device/control/power
 * @body { "state": "ON" } hoặc { "state": "OFF" }
 */
exports.controlPower = async (req, res) => {
    try {
        // 1. Validate đầu vào (Chỉ chấp nhận ON hoặc OFF)
        const { state } = req.body; 
        if (!['ON', 'OFF'].includes(state)) {
            return res.status(400).json({ message: "Trạng thái không hợp lệ. Chỉ gửi 'ON' hoặc 'OFF'." });
        }

        // 2. Lấy Device ID từ User Token (BẢO MẬT)
        const userId = req.user.id; // Lấy từ middleware verifyToken
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

        // 4. Gửi lệnh MQTT (Chỉ gửi Power)
        sendCommand(targetDeviceId, { power: state });

        // 5. Trả về kết quả
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
 * @route GET /api/device/:deviceId/status
 */
exports.getDeviceStatus = async (req, res) => {
    try {

        const userId = req.user.id; 
        
        const user = await User.findById(userId);

        if (!user || !user.device_id) {
            return res.status(404).json({ 
                message: "Tài khoản của bạn chưa liên kết với thiết bị nào." 
            });
        }

        const targetDeviceId = user.device_id; // Lấy ID thiết bị từ User

        // BƯỚC 2: Tìm thiết bị trong bảng Device
        const device = await Device.findOne({ device_id: targetDeviceId });

        if (!device) {
            return res.status(404).json({ 
                message: "Không tìm thấy thiết bị nào được liên kết với tài khoản của bạn." 
            });
        }
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


exports.getSensorHistory = async (req, res) => {
    try {
        // 1. Lấy User ID từ Token
        const userId = req.user.id; 
        
        const user = await User.findById(userId);

        if (!user || !user.device_id) {
            return res.status(404).json({ 
                message: "Tài khoản của bạn chưa liên kết với thiết bị nào." 
            });
        }

        const targetDeviceId = user.device_id;

        // 2. Tìm thiết bị (Bước này để check xem device có tồn tại ko, optional)
        const device = await Device.findOne({ device_id: targetDeviceId });
        if (!device) {
            return res.status(404).json({ message: "Thiết bị không tồn tại trong hệ thống!" });
        }

        // 3. Lấy Log
        const limit = 10;
        // LƯU Ý: Nếu DB bạn dùng timestamp thì sort theo timestamp sẽ nhanh hơn
        const logs = await SensorLog.find({ device_id: targetDeviceId })
            .sort({ timestamp: -1}) // Sort theo timestamp hoặc _id đều được (giảm dần)
            .limit(limit);
        


        // 4. Format dữ liệu (Đã sửa time)
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

