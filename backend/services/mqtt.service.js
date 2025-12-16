const mqtt = require('mqtt');
const Device = require('../models/device.model');
const SensorLog = require('../models/sensorlog.model');

const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://broker.hivemq.com";
const TOPIC_SENSOR_PATTERN = "smartbulb/sensor/+"; 

const BATCH_SIZE = 50;
const FLUSH_INTERVAL = 5000;

let mqttClient = null;
let sensorBuffer = [];
let validDeviceIds = new Set();

const loadValidDevices = async () => {
    try {
        const devices = await Device.find({}, 'device_id');
        validDeviceIds.clear();
        devices.forEach(d => validDeviceIds.add(d.device_id));
    } catch (error) {
        console.error("Lỗi load cache device:", error);
    }
};

const flushBufferToDB = async () => {
    if (sensorBuffer.length === 0) return;

    const dataToProcess = [...sensorBuffer];
    sensorBuffer = [];

    try {
        const groupedByDevice = {};
        
        dataToProcess.forEach(record => {
            if (!groupedByDevice[record.device_id]) {
                groupedByDevice[record.device_id] = [];
            }
            groupedByDevice[record.device_id].push(record);
        });

        const recordsToInsert = [];
        
        for (const [deviceId, records] of Object.entries(groupedByDevice)) {
            const avgTemperature = records.reduce((sum, r) => sum + (r.data?.temperature || 0), 0) / records.length;
            const avgHumidity = records.reduce((sum, r) => sum + (r.data?.humidity || 0), 0) / records.length;
            const avgAmpere = records.reduce((sum, r) => sum + (r.data?.ampere || 0), 0) / records.length;
            const avgLight = records.reduce((sum, r) => sum + (r.data?.light_level || 0), 0) / records.length;
            
            const avgRecord = {
                device_id: deviceId,
                timestamp: new Date(),
                data: {
                    temperature: Math.round(avgTemperature * 10) / 10,
                    humidity: Math.round(avgHumidity * 10) / 10,
                    ampere: Math.round(avgAmpere * 10) / 10,
                    light_level: Math.round(avgLight)
                },
                session_duration: 0,
                record_count: records.length
            };
            
            recordsToInsert.push(avgRecord);
        }

        await SensorLog.insertMany(recordsToInsert);
        console.log(`[BATCH] Saved ${recordsToInsert.length} average records to DB`);
        
    } catch (err) {
        console.error("Lỗi lưu Batch Sensor:", err);
    }
};

const connectMQTT = (io) => {
    // Load cache ngay khi khởi động
    loadValidDevices();

    mqttClient = mqtt.connect(MQTT_BROKER);
    
    mqttClient.on('connect', () => {
        console.log('MQTT Connected');
        mqttClient.subscribe(TOPIC_SENSOR_PATTERN);
        setInterval(flushBufferToDB, FLUSH_INTERVAL);
    });

    mqttClient.on('message', async (topic, message) => {
        const topicParts = topic.split('/');
        const deviceId = topicParts[2];

        if (!validDeviceIds.has(deviceId)) {
            const exists = await Device.exists({ device_id: deviceId });
            if (exists) {
                validDeviceIds.add(deviceId);
            } else {
                console.warn(`Unknown device: ${deviceId}`);
                return; 
            }
        }

        if (topicParts[1] === 'sensor') {
            try {
                const payload = JSON.parse(message.toString());
                
                const currentTime = new Date().toISOString();
                const sensorData = {
                    temp: payload.temp,
                    hum: payload.hum,
                    amp: payload.amp || 0,
                    lux: payload.lux,
                    time: currentTime,
                    timestamp: currentTime
                };
                
                io.to(deviceId).emit('sensor_update', sensorData);
                
                const time = new Date(currentTime).toLocaleString('vi-VN');
                console.log(
                    `[SOCKET SENT] [${time}] Device: ${deviceId} | ` +
                    `Temp: ${sensorData.temp}C | Hum: ${sensorData.hum}% | ` +
                    `Light: ${sensorData.lux} lux | Amp: ${sensorData.amp}A`
                );

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
                console.error(`Error processing [${deviceId}]:`, err.message);
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

