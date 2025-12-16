const mqtt = require('mqtt');
const Device = require('../models/device.model');
const SensorLog = require('../models/sensorlog.model');

// Cấu hình MQTT
const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://broker.hivemq.com"; // Hoặc broker của bạn
const TOPIC_SENSOR_PATTERN = "smartbulb/sensor/+"; 

const BATCH_SIZE = 50;        // Đủ 50 tin thì ghi xuống DB
const FLUSH_INTERVAL = 5000;  // Hoặc cứ 5 giây ghi 1 lần (dù chưa đủ 50)

let mqttClient = null;
let sensorBuffer = [];        // Cái "xô" chứa dữ liệu chờ ghi
let validDeviceIds = new Set(); // Danh sách thiết bị hợp lệ (Cache)

/**
 * 1. Hàm load danh sách thiết bị hợp lệ vào RAM
 * Giúp check thiết bị cực nhanh, không cần query DB mỗi lần nhận tin
 */
const loadValidDevices = async () => {
    try {
        const devices = await Device.find({}, 'device_id');
        validDeviceIds.clear();
        devices.forEach(d => validDeviceIds.add(d.device_id));
        console.log(`[CACHE] Đã load ${validDeviceIds.size} thiết bị hợp lệ vào RAM.`);
    } catch (error) {
        console.error("Lỗi load cache device:", error);
    }
};

/**
 * 2. Hàm đổ dữ liệu từ "xô" (RAM) xuống "kho" (DB)
 */
const flushBufferToDB = async () => {
    if (sensorBuffer.length === 0) return;

    // Copy dữ liệu ra và làm sạch xô ngay lập tức để đón tin mới
    const dataToSave = [...sensorBuffer];
    sensorBuffer = [];

    try {
        // insertMany cực nhanh với Time-Series Collection
        await SensorLog.insertMany(dataToSave);
        console.log(`[BATCH] Đã lưu ${dataToSave.length} bản ghi sensor xuống DB.`);
    } catch (err) {
        console.error("Lỗi lưu Batch Sensor:", err);
        // Nếu lỗi mạng DB, có thể push ngược lại vào buffer để thử sau
    }
};

const connectMQTT = (io) => {
    // Load cache ngay khi khởi động
    loadValidDevices();

    mqttClient = mqtt.connect(MQTT_BROKER);
    
    mqttClient.on('connect', () => {
        console.log('MQTT Connected (Batching Mode)');
        mqttClient.subscribe(TOPIC_SENSOR_PATTERN);

        // Thiết lập timer: Cứ 5 giây tự động đổ dữ liệu xuống DB 1 lần
        setInterval(flushBufferToDB, FLUSH_INTERVAL);
    });

    mqttClient.on('message', async (topic, message) => {
        // Topic mẫu: smartbulb/sensor/ESP32_01
        const topicParts = topic.split('/');
        const deviceId = topicParts[2];

        // KIỂM TRA HỢP LỆ (CHECK CACHE) 
        // Nếu ID không có trong Set -> Bỏ qua ngay
        if (!validDeviceIds.has(deviceId)) {
            // Check lại DB 1 lần cuối đề phòng mới thêm thiết bị mà chưa reload cache
            const exists = await Device.exists({ device_id: deviceId });
            if (exists) {
                validDeviceIds.add(deviceId); // Thêm vào cache
            } else {
                console.warn(`[BLOCK] Từ chối dữ liệu từ thiết bị lạ: ${deviceId}`);
                return; 
            }
        }

        // XỬ LÝ DỮ LIỆU
        if (topicParts[1] === 'sensor') {
            try {
                const payload = JSON.parse(message.toString());
                
                // Realtime cho Web (Socket) -> Gửi ngay lập tức, không được delay
                io.to(deviceId).emit('sensor_update', {
                    temp: payload.temp,
                    hum: payload.hum,
                    amp: payload.amp || 0,
                    lux: payload.lux, // Gửi lux gốc
                    time: new Date().toISOString() // Kèm thời gian để vẽ biểu đồ
                });

                // B. Gom dữ liệu vào Buffer (Chờ lưu DB)
                sensorBuffer.push({
                    device_id: deviceId,
                    timestamp: new Date(),
                    data: {
                        temperature: payload.temp,
                        humidity: payload.hum,
                        ampere: payload.amp || 0,
                        light_level: payload.lux
                    },
                    session_duration: 0 
                });

                // C. Nếu xô đầy -> Đổ ngay
                if (sensorBuffer.length >= BATCH_SIZE) {
                    await flushBufferToDB();
                }

                await Device.findOneAndUpdate(
                    { device_id: deviceId },
                    {
                        is_online: true,
                        last_updated: new Date()
                    }
                );

            } catch (err) {
                console.error(`Lỗi xử lý msg [${deviceId}]:`, err.message);
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

module.exports = { connectMQTT, reloadCache: loadValidDevices, sendCommand };

