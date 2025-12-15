const axios = require('axios');
const mqtt = require('mqtt');

// ================= CẤU HÌNH =================
const API_URL = 'http://localhost:3000/api/device'; // Đổi port nếu server bạn khác 3000
const MQTT_BROKER = 'mqtt://broker.hivemq.com';
const DEVICE_ID = 'ESP32_001'; // ID thiết bị giả lập để test

const CONTROL_TOPIC = `smartbulb/control/${DEVICE_ID}`;

// ================= PHẦN 1: GIẢ LẬP ESP32 (LẮNG NGHE LỆNH) =================
console.log('🤖 Đang khởi tạo thiết bị ảo ESP32...');
const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
    console.log(`✅ ESP32 Ảo đã kết nối MQTT. Đang lắng nghe tại: ${CONTROL_TOPIC}`);
    client.subscribe(CONTROL_TOPIC);
    
    // Sau khi kết nối xong thì mới bắt đầu chạy test
    runTestScenario(); 
});

client.on('message', (topic, message) => {
    const payload = JSON.parse(message.toString());
    console.log('\n📩 [ESP32 NHẬN ĐƯỢC LỆNH TỪ SERVER]');
    console.log(`   Topic: ${topic}`);
    console.log(`   Nội dung:`, payload);
    
    // Phân tích kết quả
    if (payload.override === '0') {
        console.log('   👉 KẾT LUẬN: Server yêu cầu KHÓA chế độ tự động (Manual Mode).');
    } else if (payload.override === '1') {
        console.log('   👉 KẾT LUẬN: Server yêu cầu MỞ KHÓA chế độ tự động (Auto Mode).');
    }
    console.log('---------------------------------------------------');
});

// ================= PHẦN 2: GIẢ LẬP WEB/APP (GỌI API) =================
const runTestScenario = async () => {
    try {
        // --- TEST CASE 1: TẮT ĐÈN THỦ CÔNG ---
        console.log('\n1️⃣  TEST 1: Người dùng nhấn nút TẮT ĐÈN trên Web...');
        // Giả sử route của bạn là /manual-power như đã định nghĩa trong deviceController
        const res1 = await axios.post(`${API_URL}/manual-power`, {
            deviceId: DEVICE_ID,
            newPowerState: 'OFF'
        });
        console.log(`   ✅ API Trả về: ${res1.data.message}`);

        
        // Đợi 3 giây rồi test tiếp
        setTimeout(async () => {
            // --- TEST CASE 2: BẬT ĐÈN THỦ CÔNG ---
            console.log('\n2️⃣  TEST 2: Người dùng nhấn nút BẬT ĐÈN trên Web...');
            const res2 = await axios.post(`${API_URL}/manual-power`, {
                deviceId: DEVICE_ID,
                newPowerState: 'ON'
            });
            console.log(`   ✅ API Trả về: ${res2.data.message}`);

            // Đợi 3 giây rồi test tiếp
            setTimeout(async () => {
                // --- TEST CASE 3: BẬT LẠI CHẾ ĐỘ AUTO ---
                console.log('\n3️⃣  TEST 3: Người dùng nhấn nút BẬT TỰ ĐỘNG (Auto Mode)...');
                const res3 = await axios.post(`${API_URL}/enable-auto`, {
                    deviceId: DEVICE_ID
                });
                console.log(`   ✅ API Trả về: ${res3.data.message}`);
                
                // Kết thúc test sau 2 giây
                setTimeout(() => {
                    console.log('\n🎉 Đã hoàn thành bài test!');
                    client.end();
                    process.exit();
                }, 2000);

            }, 3000);

        }, 3000);

    } catch (error) {
        console.error('❌ LỖI GỌI API:', error.response ? error.response.data : error.message);
    }
};
