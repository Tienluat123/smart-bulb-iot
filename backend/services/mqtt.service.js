const mqtt = require('mqtt');
const SensorLog = require('../models/sensorlog.model');
const Device = require('../models/device.model');

const MQTT_BROKER = "mqtt://broker.hivemq.com";

// [THAY ĐỔI 1] Dùng dấu + (Wildcard) để nghe TẤT CẢ các đèn
// Thay vì nghe cụ thể 001, ta nghe: smartbulb/sensor/BẤT_CỨ_CÁI_GÌ
const TOPIC_SENSOR_PATTERN = "smartbulb/sensor/+"; 

let mqttClient = null;

// Hàm khởi tạo MQTT
const connectMQTT = (io) => {
    mqttClient = mqtt.connect(MQTT_BROKER);

    mqttClient.on('connect', () => {
        console.log('✅ MQTT Connected (Multi-Device Mode)');
        // Đăng ký nghe theo mẫu (Pattern)
        mqttClient.subscribe(TOPIC_SENSOR_PATTERN);
    });

    mqttClient.on('message', async (topic, message) => {
        // [THAY ĐỔI 2] Tách lấy ID thiết bị từ Topic
        // Topic có dạng: smartbulb/sensor/ESP32_001
        // split('/') sẽ ra mảng: ['smartbulb', 'sensor', 'ESP32_001']
        const topicParts = topic.split('/');
        const deviceId = topicParts[2]; // Lấy được ID động (ví dụ: ESP32_002)

        // Chỉ xử lý nếu đúng là topic sensor
        if (topicParts[1] === 'sensor' && deviceId) {
            try {
                const payload = JSON.parse(message.toString());

                // 1. Lưu Log (Lưu đúng vào ID của thiết bị gửi lên)
                await SensorLog.create({
                    device_id: deviceId, // <--- ID động
                    data: {
                        temperature: payload.temp,
                        humidity: payload.hum,
                        ampere: payload.amp || 0,
                        light_level: payload.lux
                    }
                });

                // 2. Bắn Socket về Web
                // [THAY ĐỔI 3] Thay vì emit tất cả, chỉ emit vào "Phòng" của thiết bị đó
                // Chỉ user nào đang sở hữu/xem thiết bị này mới nhận được
                io.to(deviceId).emit('sensor_update', payload);

                // 3. Logic Auto Control (Truyền thêm deviceId để biết điều khiển đèn nào)
                await processAutoControl(deviceId, payload);

            } catch (err) {
                console.error(`❌ Lỗi MQTT [${deviceId}]:`, err.message);
            }
        }
    });

    return mqttClient;
};

// Logic Auto Control (Cần nhận thêm deviceId)
const processAutoControl = async (deviceId, data) => {
    const currentHour = new Date().getHours();
    let newMode = "MANUAL";
    let newBrightness = 0;

    // Logic tính toán giữ nguyên
    if (currentHour >= 23 || currentHour < 6) {
        newMode = "SLEEP";
        newBrightness = data.lux < 50 ? 20 : 0;
    } else if (currentHour >= 18) {
        newMode = "READ";
        newBrightness = 50;
    } else {
        newMode = "FOCUS";
        if (data.lux < 300) newBrightness = 100;
        else if (data.lux < 600) newBrightness = 70;
        else newBrightness = 0;
    }

    // [THAY ĐỔI 4] Gửi lệnh xuống đúng thiết bị đó
    sendCommand(deviceId, { mode: newMode, brightness: newBrightness });

    // Cập nhật DB cho đúng thiết bị
    await Device.findOneAndUpdate(
        { device_id: deviceId }, // <--- Tìm theo ID động
        {
            is_online: true,
            current_state: { power: newBrightness > 0 ? "ON" : "OFF", mode: newMode, brightness: newBrightness },
            last_updated: new Date()
        }
    );
};

// Hàm gửi lệnh (Cần nhận thêm deviceId để biết gửi đi đâu)
const sendCommand = (deviceId, commandObj) => {
    if (mqttClient) {
        // Tạo topic động: smartbulb/control/ESP32_002
        const controlTopic = `smartbulb/control/${deviceId}`;
        mqttClient.publish(controlTopic, JSON.stringify(commandObj));
        // console.log(`📤 Gửi lệnh tới ${deviceId}:`, commandObj);
    }
};

module.exports = { connectMQTT, sendCommand };
