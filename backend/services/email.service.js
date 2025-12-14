const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendReportEmail = async (userEmail, userName, stats, aiResult) => {
    // 1. Xử lý Điểm số
    const score = aiResult.score || 0;

    // 2. Xử lý Đánh giá chung (env_evaluation)
    const conditionLabel = aiResult.env_evaluation || "Chưa xác định";

    // 3. [QUAN TRỌNG] Xử lý Lời khuyên (advise)
    // JSON của bạn trả về: "advise": "Môi trường Ổn định..." (là String, chữ s)
    const rawAdvice = aiResult.advise || "Không có lời khuyên cụ thể.";
    
    // Vì nó là chuỗi, ta để nó vào thẻ <li> trực tiếp luôn, không cần map()
    const adviceHtml = `<li>${rawAdvice}</li>`;

    const htmlContent = `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #ddd; max-width: 600px; margin: auto;">
            <h2 style="color: #27ae60; text-align: center;">Báo Cáo Môi Trường Học Tập 🌿</h2>
            <p>Xin chào <strong>${userName}</strong>,</p>
            <p>Hệ thống IoT SmartBulb đã phân tích dữ liệu tuần qua của bạn:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f8f9fa;">
                    <th style="padding: 10px; border: 1px solid #ddd;">Chỉ số</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Trung bình</th>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">🌡 Nhiệt độ</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${Number(stats.avg_temp).toFixed(1)}°C</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">💧 Độ ẩm</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${Number(stats.avg_hum).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">💡 Ánh sáng</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${Number(stats.avg_lux).toFixed(0)} Lux</td>
                </tr>
            </table>

            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #0d47a1;">🤖 AI Đánh giá: ${conditionLabel}</h3>
                <p><strong>Điểm số môi trường:</strong> ${score}/100</p>
                <p><strong>Chi tiết & Lời khuyên:</strong></p>
                <ul>${adviceHtml}</ul>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
                <p>Email này được gửi tự động từ hệ thống SmartBulb IoT.</p>
            </div>
        </div>
    `;

    await transporter.sendMail({
        from: `"SmartBulb IoT" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `[Báo Cáo Tuần] ${userName} - Điểm: ${score}/100 (${conditionLabel})`,
        html: htmlContent
    });
};

module.exports = { sendReportEmail };
