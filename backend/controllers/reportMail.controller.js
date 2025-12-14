const SensorLog = require('../models/sensorlog.model');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs'); // Thêm thư viện fs để kiểm tra file

exports.getWeeklyReport = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 1. Lấy dữ liệu từ MongoDB
        const stats = await SensorLog.aggregate([
            { $match: { device_id: "ESP32_001", timestamp: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: null,
                    avg_temp: { $avg: "$data.temperature" },
                    avg_hum:  { $avg: "$data.humidity" },
                    avg_lux:  { $avg: "$data.light_level" },
                    total_logs: { $sum: 1 }
                }
            }
        ]);

        // Dữ liệu giả lập nếu chưa có DB (để test)
        const data = stats.length > 0 ? stats[0] : { avg_temp: 28, avg_hum: 65, avg_lux: 450 };

        // 2. XÁC ĐỊNH ĐƯỜNG DẪN PYTHON (QUAN TRỌNG)
        // __dirname đang ở: .../backend/controllers
        // Chúng ta cần ra:  .../backend/venv/bin/python
        
        let pythonExecutable;
        if (process.platform === "win32") {
            pythonExecutable = path.resolve(__dirname, '../venv/Scripts/python.exe');
        } else {
            pythonExecutable = path.resolve(__dirname, '../venv/bin/python');
        }

        // --- DEBUG: Kiểm tra xem file Python có thật không ---
        if (!fs.existsSync(pythonExecutable)) {
            console.error("LỖI: Không tìm thấy file Python tại:", pythonExecutable);
            console.error("Hãy chắc chắn bạn đã tạo folder 'venv' ở thư mục backend!");
            
            // Fallback: Nếu không thấy venv, thử dùng python3 hệ thống (chữa cháy)
            pythonExecutable = 'python3'; 
        } else {
            console.log("🐍 Tìm thấy Python venv tại:", pythonExecutable);
        }

        const pythonScriptPath = path.resolve(__dirname, '../ai_service/predict.py');

        // 3. GỌI PYTHON
        const pythonProcess = spawn(pythonExecutable, [
            pythonScriptPath, 
            data.avg_temp, 
            data.avg_hum, 
            data.avg_lux
        ]);

        let resultData = "";
        let errorData = "";

        // Hứng dữ liệu thành công
        pythonProcess.stdout.on('data', (d) => { 
            resultData += d.toString(); 
        });

        // Hứng lỗi từ Python (nếu có)
        pythonProcess.stderr.on('data', (d) => {
            errorData += d.toString();
            console.error("🐍 Python Log:", d.toString());
        });

        // Xử lý khi Python chạy xong
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return res.status(500).json({ 
                    error: "Lỗi chạy AI", 
                    details: errorData 
                });
            }

            try {
                // Python có thể in ra nhiều dòng log, ta chỉ lấy dòng cuối cùng là JSON
                // Hoặc tìm dòng chứa dấu { để parse
                const jsonStartIndex = resultData.indexOf('{');
                const jsonString = resultData.substring(jsonStartIndex);
                const aiResult = JSON.parse(jsonString);
                
                res.json({
                    report_title: "Báo cáo Môi trường Học tập (AI)",
                    period: "7 ngày qua",
                    statistics: {
                        temperature: data.avg_temp.toFixed(1) + "°C",
                        humidity: data.avg_hum.toFixed(1) + "%",
                        light_level: data.avg_lux.toFixed(0) + " Lux"
                    },
                    ai_assessment: aiResult
                });
            } catch (e) {
                res.status(500).json({ 
                    error: "Lỗi đọc JSON từ Python", 
                    raw_output: resultData,
                    parse_error: e.message
                });
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
