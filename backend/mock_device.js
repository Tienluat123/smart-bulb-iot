const mqtt = require('mqtt');

// Kết nối cùng Broker với Server
const client = mqtt.connect("mqtt://broker.hivemq.com");
const TOPIC = "smartbulb/sensor/ESP32_001";

client.on('connect', () => {
  console.log("💡 BÓNG ĐÈN ẢO (ESP32) ĐÃ KẾT NỐI!");
  
  // Gửi dữ liệu giả lập mỗi 3 giây
  setInterval(() => {
    // Random số liệu môi trường
    const temp = (25 + Math.random() * 5).toFixed(1); // 25 - 30 độ
    const hum = (50 + Math.random() * 20).toFixed(0); // 50 - 70%
    const lux = (100 + Math.random() * 800).toFixed(0); // Ánh sáng

    const payload = JSON.stringify({
      temp: parseFloat(temp),
      hum: parseInt(hum),
      amp: 0.12,
      lux: parseInt(lux)
    });

    client.publish(TOPIC, payload);
    console.log(`📤 Đã gửi: ${payload}`);
  }, 3000); // 3000ms = 3 giây
});
