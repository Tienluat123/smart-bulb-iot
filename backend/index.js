require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db'); // Đảm bảo file này export hàm async

// Import Services
const { connectMQTT } = require('./services/mqtt.service');
const { initSocket } = require('./services/socket.service');
const reportRoute = require('./routes/reportMail.route');
const authRoute = require('./routes/auth.route');
const chatRoute = require('./routes/chat.route');

const deviceRoute = require('./routes/device.route')
const reportPushsaferRoute = require('./routes/reportPushsafer.route');

// Init App
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

app.use('/api/report', reportRoute);
app.use('/api/auth', authRoute);
app.use('/api/chat', chatRoute);
app.use('/api/device', deviceRoute);
app.use('/api/pushsafer', reportPushsaferRoute);



const PORT = 5001;

// ==========================================
// HÀM KHỞI ĐỘNG SERVER (QUAN TRỌNG)
// ==========================================
const startServer = async () => {
    try {
        // 1. Đợi kết nối Database xong hẳn rồi mới đi tiếp
        await connectDB(); 
        console.log("Database đã sẵn sàng, bắt đầu khởi động các dịch vụ khác...");

        // 2. Sau khi DB ngon lành thì mới chạy MQTT và Socket
        // (Để tránh lỗi tìm dữ liệu khi chưa có kết nối)
        connectMQTT(io);
        initSocket(io);

        // 3. Cuối cùng mới mở cổng Server
        httpServer.listen(PORT, () => {
            console.log(`Server Clean Code chạy port ${PORT}`);
        });

    } catch (error) {
        console.error("Lỗi khởi động Server:", error.message);
        process.exit(1); // Tắt server nếu lỗi DB
    }
};

// Chạy hàm khởi động
startServer();
