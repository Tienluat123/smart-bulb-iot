require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/user.model'); // Đảm bảo đường dẫn đúng

const users = [
    {
        username: "sv01", // [MỚI] Dùng cái này để đăng nhập
        fullname: "Nguyễn Tiến Luật",
        email: "luat_school@demo.com", // Mail ban đầu
        password: "123",
        device_id: "ESP32_001",
        phone: "0909123456"
    },
    {
        username: "gv01", // [MỚI]
        fullname: "Thầy Giáo Demo",
        email: "thay_school@demo.com",
        password: "123",
        device_id: "ESP32_002",
        phone: "0912345678"
    }
];


const importData = async () => {
    try {
        await connectDB();

        // 1. Xóa hết user cũ (để làm mới lại từ đầu)
        await User.deleteMany();
        console.log("🗑️ Đã xóa dữ liệu cũ...");

        // 2. Tạo user mới (Middleware trong Model sẽ tự mã hóa password)
        await User.create(users);
        
        console.log("✅ Đã tạo tài khoản mẫu thành công!");
        console.log("👉 Bạn có thể đăng nhập bằng: luat@gmail.com / 123");
        process.exit();
    } catch (error) {
        console.error("❌ Lỗi:", error);
        process.exit(1);
    }
};

importData();
