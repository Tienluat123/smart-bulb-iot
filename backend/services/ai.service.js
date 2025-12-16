const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const runPythonAI = (temp, hum, lux) => {
    return new Promise((resolve, reject) => {
        // 1. Tìm đường dẫn Python
        let pythonExecutable;
        
        // [SỬA LỖI] Ở đây dùng global 'process' để check hệ điều hành
        if (process.platform === "win32") {
            pythonExecutable = path.resolve(__dirname, '../venv/Scripts/python.exe');
        } else {
            pythonExecutable = path.resolve(__dirname, '../venv/bin/python');
        }

        if (!fs.existsSync(pythonExecutable)) {
            pythonExecutable = 'python'; // Fallback
        }

        const scriptPath = path.resolve(__dirname, '../ai_service/predict.py');

        // [SỬA LỖI QUAN TRỌNG] Đổi tên biến từ 'process' thành 'pythonProcess'
        // Để không bị trùng với biến 'process' của hệ thống ở trên
        const pythonProcess = spawn(pythonExecutable, [scriptPath, temp, hum, lux]);

        let resultString = "";
        
        // Sửa các dòng dưới dùng 'pythonProcess' thay vì 'process'
        pythonProcess.stdout.on('data', (data) => {
            resultString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error("🐍 Python Log:", data.toString());
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error("Python script exited with error code " + code));
            }
            try {
                const jsonStartIndex = resultString.indexOf('{');
                if (jsonStartIndex === -1) throw new Error("No JSON found");
                
                const json = JSON.parse(resultString.substring(jsonStartIndex));
                resolve(json);
            } catch (err) {
                reject(new Error("Failed to parse Python JSON output: " + resultString));
            }
        });
    });
};

module.exports = { runPythonAI };
