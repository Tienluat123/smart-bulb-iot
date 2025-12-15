const Device = require('../models/device.model');
const { sendCommand } = require('../services/mqtt.service'); // Import hàm gửi lệnh MQTT

// Hàm gửi lệnh Khóa/Mở khóa chế độ tự động
const sendOverrideCommand = (deviceId, isEnabled) => {
    // isEnabled = true (1) -> Mở khóa; isEnabled = false (0) -> Khóa
    const payload = isEnabled ? '1' : '0'; 
    
    // Gửi lệnh qua hàm sendCommand đã định nghĩa trong mqttService
    sendCommand(deviceId, { override: payload });
    
    // Gửi lệnh Khóa/Mở khóa đến ESP32.
    // Lưu ý: Cấu trúc lệnh này phải khớp với code lắng nghe trên ESP32
    // Ví dụ: gửi { "override": "0" } hoặc { "override": "1" }
};


/**
 * @description Xử lý Bật/Tắt đèn thủ công từ Web/App. Hành động này sẽ TỰ ĐỘNG KHÓA chế độ tự động.
 * @route POST /api/device/control/power
 * @body {deviceId: "ESP32_001", newPowerState: "OFF"}
 */


exports.manualPowerControl = async (req, res) => {
    const { deviceId, newPowerState } = req.body; 
    
    if (!['ON', 'OFF'].includes(newPowerState)) {
        return res.status(400).json({ message: "Trạng thái nguồn không hợp lệ. Phải là 'ON' hoặc 'OFF'." });
    }

    try {
        const isTurningOff = (newPowerState === 'OFF');
        
        // 1. Cập nhật DB: Cập nhật trạng thái nguồn và KHÓA chế độ tự động
        const updatedDevice = await Device.findOneAndUpdate(
            { device_id: deviceId },
            { 
                'current_state.power': newPowerState,
                // Khi người dùng chạm vào nút nguồn, ta KHÓA tự động (false)
                'control_flags.auto_adjustment_enabled': false,
                // Giả định độ sáng max khi BẬT, 0 khi TẮT
                'current_state.brightness': isTurningOff ? 0 : 100 
            },
            { new: true }
        );
        
        if (!updatedDevice) {
            return res.status(404).json({ message: "Không tìm thấy thiết bị." });
        }

        // 2. Gửi lệnh BẬT/TẮT xuống ESP32
        // Gửi lệnh đầy đủ để Chip cập nhật (Power, Brightness)
        sendCommand(deviceId, { power: newPowerState, brightness: isTurningOff ? 0 : 100 });

        // 3. Gửi lệnh KHÓA tự động (0) xuống ESP32
        sendOverrideCommand(deviceId, false); // Gửi 0 (false) để KHÓA
        
        res.status(200).json({ 
            message: `Đã chuyển đèn sang ${newPowerState} và KHÓA chế độ tự động.`,
            state: updatedDevice.current_state
        });

    } catch (error) {
        console.error("Lỗi điều khiển thủ công:", error);
        res.status(500).json({ message: "Lỗi Server khi điều khiển thiết bị." });
    }
};


/**
 * @description Xử lý việc BẬT lại chế độ Tự động điều chỉnh.
 * @route POST /api/device/control/enable-auto
 * @body {deviceId: "ESP32_001"}
 */

exports.enableAutoControl = async (req, res) => {
    const { deviceId } = req.body;

    try {
        // 1. Cập nhật DB: MỞ KHÓA chế độ tự động
        const updatedDevice = await Device.findOneAndUpdate(
            { device_id: deviceId },
            { 
                'control_flags.auto_adjustment_enabled': true, // BẬT chế độ tự động (true)
            },
            { new: true }
        );

        if (!updatedDevice) {
            return res.status(404).json({ message: "Không tìm thấy thiết bị." });
        }

        // 2. Gửi lệnh MỞ KHÓA (1) xuống ESP32
        sendOverrideCommand(deviceId, true); // Gửi 1 (true) để MỞ KHÓA
        
        // 3. (Tùy chọn) Gửi lệnh BẬT đèn nếu nó đang OFF
        // Thường khi bật Auto thì đèn phải BẬT, để logic nội bộ của chip xử lý độ sáng ngay
        if (updatedDevice.current_state.power === 'OFF') {
             sendCommand(deviceId, { power: 'ON', brightness: 100 });
             await Device.updateOne({ device_id: deviceId }, { 'current_state.power': 'ON', 'current_state.brightness': 100 });
        }
        
        res.status(200).json({ 
            message: "Đã BẬT lại chế độ Tự động điều chỉnh.",
            isAutoEnabled: true
        });

    } catch (error) {
        console.error("Lỗi bật tự động:", error);
        res.status(500).json({ message: "Lỗi Server khi bật chế độ tự động." });
    }
};

/**
 * @description Hàm kiểm tra trạng thái thiết bị
 * @route GET /api/device/:deviceId/status
 */
exports.getDeviceStatus = async (req, res) => {
    try {
        const deviceId = req.params.deviceId;
        const device = await Device.findOne({ device_id: deviceId });
        
        if (!device) {
            return res.status(404).json({ message: "Không tìm thấy thiết bị." });
        }

        res.json({
            current_state: device.current_state,
            control_flags: device.control_flags,
            is_online: device.is_online,
            last_updated: device.last_updated
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi Server khi lấy trạng thái thiết bị." });
    }
};

