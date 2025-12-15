const mqtt = require('mqtt');
const SensorLog = require('../models/sensorlog.model');
const Device = require('../models/device.model');

const MQTT_BROKER = "mqtt://broker.hivemq.com";
const TOPIC_SENSOR_PATTERN = "smartbulb/sensor/+"; 

let mqttClient = null;

// Hàm tiện ích: Chỉ tính Mode phục vụ Thống kê và hiển thị (Không gửi lệnh)
const getModeForStatistics = (currentHour) => {
    if (currentHour >= 23 || currentHour < 6) {
        return "SLEEP";
    } else if (currentHour >= 18) {
        return "READ";
    } else {
        return "FOCUS";
    }
};

const connectMQTT = (io) => {
    mqttClient = mqtt.connect(MQTT_BROKER);
    
    mqttClient.on('connect', () => {
        console.log('MQTT Connected (Multi-Device Mode)');
        mqttClient.subscribe(TOPIC_SENSOR_PATTERN);
    });

    mqttClient.on('message', async (topic, message) => {
        const topicParts = topic.split('/');
        console.log('Received MQTT message:', topicParts);
        const deviceId = topicParts[2];

        if (topicParts[1] === 'sensor' && deviceId) {
            try {
                const payload = JSON.parse(message.toString());
                const currentHour = new Date().getHours();
                const modeForStats = getModeForStatistics(currentHour); // Chỉ tính Mode để lưu DB

                console.log(`[MQTT IN] Thiết bị ${deviceId} đã parse thành công:`, payload);

                // 1. Lưu Log
                await SensorLog.create({
                    device_id: deviceId,
                    data: {
                        temperature: payload.temp,
                        humidity: payload.hum,
                        ampere: payload.amp || 0,
                        light_level: payload.lux
                    }
                });

                // 2. Bắn Socket về Web
                io.to(deviceId).emit('sensor_update', payload);

                // 3. Cập nhật DB (Chỉ cập nhật Mode và trạng thái Online/Thời gian)
                await Device.findOneAndUpdate(
                    { device_id: deviceId },
                    {
                        is_online: true,
                        // Cập nhật Mode theo thời gian (Cho mục đích thống kê và hiển thị)
                        "current_state.mode": modeForStats, 
                        last_updated: new Date()
                    }
                    // LƯU Ý: current_state.power và current_state.brightness KHÔNG được cập nhật ở đây
                    // mà sẽ được cập nhật từ lệnh thủ công của Web (deviceController.js)
                );

                // 4. KHÔNG GỌI processAutoControl nữa, tránh can thiệp vào Chip.

            } catch (err) {
                console.error(`Lỗi MQTT [${deviceId}]:`, err.message);
            }
        }
    });

    return mqttClient;
};

// Hàm gửi lệnh (Giữ lại để Controller dùng cho Bật/Tắt và Khóa/Mở khóa)
const sendCommand = (deviceId, commandObj) => {
    if (mqttClient) {
        // Tạo topic động: smartbulb/control/ESP32_002
        const controlTopic = `smartbulb/control/${deviceId}`;
        console.log(`[MQTT OUT] Gửi lệnh đến ${deviceId} tại topic ${controlTopic}:`, commandObj);
        mqttClient.publish(controlTopic, JSON.stringify(commandObj));
    }
};

module.exports = { connectMQTT, sendCommand };
